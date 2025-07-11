const { extractUserFromToken } = require('../middleware/auth');
const Activity = require('../models/Activity');

const connectedUsers = new Map(); // Store connected users: socketId -> user info

const socketHandler = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const user = await extractUserFromToken(token);
      
      if (!user) {
        return next(new Error('Invalid authentication token'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected (${socket.id})`);
    
    // Store connected user
    connectedUsers.set(socket.id, {
      id: socket.user._id.toString(),
      username: socket.user.username,
      fullName: socket.user.fullName,
      avatar: socket.user.avatar,
      socketId: socket.id,
      connectedAt: new Date()
    });

    // Join user to their personal room
    socket.join(`user:${socket.user._id}`);
    
    // Join global board room for real-time updates
    socket.join('board');

    // Emit updated user list to all connected users
    io.to('board').emit('users:updated', Array.from(connectedUsers.values()));

    // Handle task-related events
    socket.on('task:join', (taskId) => {
      socket.join(`task:${taskId}`);
      console.log(`User ${socket.user.username} joined task room: ${taskId}`);
    });

    socket.on('task:leave', (taskId) => {
      socket.leave(`task:${taskId}`);
      console.log(`User ${socket.user.username} left task room: ${taskId}`);
    });

    // Handle task editing sessions
    socket.on('task:start-edit', async (data) => {
      const { taskId, version } = data;
      
      try {
        // Notify other users that this task is being edited
        socket.to(`task:${taskId}`).emit('task:edit-started', {
          taskId,
          editedBy: {
            id: socket.user._id,
            username: socket.user.username,
            fullName: socket.user.fullName,
            avatar: socket.user.avatar
          },
          startTime: new Date()
        });

        socket.join(`editing:${taskId}`);
        
        console.log(`User ${socket.user.username} started editing task: ${taskId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to start edit session' });
      }
    });

    socket.on('task:end-edit', async (data) => {
      const { taskId } = data;
      
      try {
        // Notify other users that editing session ended
        socket.to(`task:${taskId}`).emit('task:edit-ended', {
          taskId,
          editedBy: {
            id: socket.user._id,
            username: socket.user.username,
            fullName: socket.user.fullName
          },
          endTime: new Date()
        });

        socket.leave(`editing:${taskId}`);
        
        console.log(`User ${socket.user.username} ended editing task: ${taskId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to end edit session' });
      }
    });

    // Handle real-time typing indicators
    socket.on('task:typing', (data) => {
      const { taskId, isTyping } = data;
      
      socket.to(`task:${taskId}`).emit('task:user-typing', {
        taskId,
        user: {
          id: socket.user._id,
          username: socket.user.username,
          fullName: socket.user.fullName
        },
        isTyping,
        timestamp: new Date()
      });
    });

    // Handle conflict resolution
    socket.on('conflict:resolve', async (data) => {
      const { taskId, resolution, conflictId } = data;
      
      try {
        // Broadcast conflict resolution to all users watching this task
        io.to(`task:${taskId}`).emit('conflict:resolved', {
          taskId,
          resolvedBy: {
            id: socket.user._id,
            username: socket.user.username,
            fullName: socket.user.fullName
          },
          resolution,
          conflictId,
          timestamp: new Date()
        });

        // Log resolution activity
        await Activity.logActivity({
          action: 'conflict_resolved',
          actor: socket.user._id,
          description: `${socket.user.fullName} resolved conflict on task using ${resolution}`,
          category: 'task',
          severity: 'medium',
          conflictId,
          details: {
            resolution,
            taskId
          }
        });

        console.log(`Conflict resolved by ${socket.user.username} for task: ${taskId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to resolve conflict' });
      }
    });

    // Handle board synchronization
    socket.on('board:sync', () => {
      // Request for full board sync - emit current board state
      // This would typically fetch and send the current tasks
      socket.emit('board:sync-requested');
    });

    // Handle activity feed updates
    socket.on('activity:subscribe', () => {
      socket.join('activity-feed');
      console.log(`User ${socket.user.username} subscribed to activity feed`);
    });

    socket.on('activity:unsubscribe', () => {
      socket.leave('activity-feed');
      console.log(`User ${socket.user.username} unsubscribed from activity feed`);
    });

    // Handle custom events for real-time collaboration
    socket.on('cursor:move', (data) => {
      const { taskId, position } = data;
      
      socket.to(`task:${taskId}`).emit('cursor:moved', {
        user: {
          id: socket.user._id,
          username: socket.user.username,
          fullName: socket.user.fullName,
          avatar: socket.user.avatar
        },
        position,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.username} disconnected (${socket.id}): ${reason}`);
      
      // Remove from connected users
      connectedUsers.delete(socket.id);
      
      // Emit updated user list
      io.to('board').emit('users:updated', Array.from(connectedUsers.values()));
      
      // Notify about user leaving any edit sessions
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith('editing:')) {
          const taskId = room.replace('editing:', '');
          socket.to(`task:${taskId}`).emit('task:edit-ended', {
            taskId,
            editedBy: {
              id: socket.user._id,
              username: socket.user.username,
              fullName: socket.user.fullName
            },
            endTime: new Date(),
            reason: 'user_disconnected'
          });
        }
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.username}:`, error);
    });
  });

  // Utility functions for emitting to specific rooms
  const emitToBoard = (event, data) => {
    io.to('board').emit(event, data);
  };

  const emitToTask = (taskId, event, data) => {
    io.to(`task:${taskId}`).emit(event, data);
  };

  const emitToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  const emitToActivityFeed = (event, data) => {
    io.to('activity-feed').emit(event, data);
  };

  const getConnectedUsers = () => {
    return Array.from(connectedUsers.values());
  };

  const isUserConnected = (userId) => {
    return Array.from(connectedUsers.values()).some(user => user.id === userId);
  };

  // Expose utility functions for use in other parts of the application
  io.todoBoard = {
    emitToBoard,
    emitToTask,
    emitToUser,
    emitToActivityFeed,
    getConnectedUsers,
    isUserConnected
  };

  return io;
};

module.exports = socketHandler;