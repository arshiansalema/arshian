import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        toast.success('Connected to real-time updates');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
        toast.error('Lost connection to server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
        toast.error('Failed to connect to real-time updates');
      });

      // Handle user list updates
      newSocket.on('users:updated', (users) => {
        setConnectedUsers(users);
      });

      // Handle real-time task updates
      newSocket.on('task:updated', (data) => {
        toast.success(`Task "${data.task.title}" was updated by ${data.updatedBy.fullName}`);
      });

      newSocket.on('task:created', (data) => {
        toast.success(`New task "${data.task.title}" created by ${data.createdBy.fullName}`);
      });

      newSocket.on('task:deleted', (data) => {
        toast.info(`Task "${data.taskTitle}" was deleted by ${data.deletedBy.fullName}`);
      });

      newSocket.on('task:moved', (data) => {
        toast.info(`Task "${data.task.title}" moved to ${data.task.status}`);
      });

      newSocket.on('task:assigned', (data) => {
        if (data.task.assignedTo.id === user.id) {
          toast.success(`You were assigned to task "${data.task.title}"`);
        } else {
          toast.info(`Task "${data.task.title}" assigned to ${data.task.assignedTo.fullName}`);
        }
      });

      // Handle editing sessions
      newSocket.on('task:edit-started', (data) => {
        if (data.editedBy.id !== user.id) {
          toast.info(`${data.editedBy.fullName} started editing a task`);
        }
      });

      newSocket.on('task:edit-ended', (data) => {
        if (data.editedBy.id !== user.id) {
          toast.info(`${data.editedBy.fullName} finished editing`);
        }
      });

      // Handle conflicts
      newSocket.on('conflict:detected', (data) => {
        if (data.conflictUsers.includes(user.id)) {
          toast.error(`Conflict detected on task "${data.taskTitle}"`);
        }
      });

      newSocket.on('conflict:resolved', (data) => {
        toast.success(`Conflict resolved on task using ${data.resolution}`);
      });

      // Handle activity updates
      newSocket.on('activity:new', (activity) => {
        if (activity.actor.id !== user.id) {
          toast.info(activity.description);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, token]);

  // Socket utility functions
  const joinTaskRoom = (taskId) => {
    if (socket) {
      socket.emit('task:join', taskId);
    }
  };

  const leaveTaskRoom = (taskId) => {
    if (socket) {
      socket.emit('task:leave', taskId);
    }
  };

  const startEditingTask = (taskId, version) => {
    if (socket) {
      socket.emit('task:start-edit', { taskId, version });
    }
  };

  const endEditingTask = (taskId) => {
    if (socket) {
      socket.emit('task:end-edit', { taskId });
    }
  };

  const emitTyping = (taskId, isTyping) => {
    if (socket) {
      socket.emit('task:typing', { taskId, isTyping });
    }
  };

  const resolveConflict = (taskId, resolution, conflictId) => {
    if (socket) {
      socket.emit('conflict:resolve', { taskId, resolution, conflictId });
    }
  };

  const subscribeToActivityFeed = () => {
    if (socket) {
      socket.emit('activity:subscribe');
    }
  };

  const unsubscribeFromActivityFeed = () => {
    if (socket) {
      socket.emit('activity:unsubscribe');
    }
  };

  const value = {
    socket,
    isConnected,
    connectedUsers,
    joinTaskRoom,
    leaveTaskRoom,
    startEditingTask,
    endEditingTask,
    emitTyping,
    resolveConflict,
    subscribeToActivityFeed,
    unsubscribeFromActivityFeed
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}