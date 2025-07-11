import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { tasksAPI, usersAPI, activitiesAPI } from '../utils/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const TaskContext = createContext();

const initialState = {
  tasks: {
    todo: [],
    'in-progress': [],
    done: []
  },
  users: [],
  activities: [],
  loading: false,
  error: null,
  currentConflict: null,
  editingSessions: {}
};

function taskReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_TASKS':
      return { 
        ...state, 
        tasks: action.payload, 
        loading: false,
        error: null 
      };

    case 'ADD_TASK':
      const newTaskStatus = action.payload.status;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [newTaskStatus]: [...state.tasks[newTaskStatus], action.payload]
        }
      };

    case 'UPDATE_TASK':
      const updatedTask = action.payload;
      const newTasks = { ...state.tasks };
      
      // Remove task from all columns
      Object.keys(newTasks).forEach(status => {
        newTasks[status] = newTasks[status].filter(task => task._id !== updatedTask._id);
      });
      
      // Add task to correct column
      newTasks[updatedTask.status].push(updatedTask);
      
      return { ...state, tasks: newTasks };

    case 'DELETE_TASK':
      const taskId = action.payload;
      const tasksAfterDelete = { ...state.tasks };
      
      Object.keys(tasksAfterDelete).forEach(status => {
        tasksAfterDelete[status] = tasksAfterDelete[status].filter(task => task._id !== taskId);
      });
      
      return { ...state, tasks: tasksAfterDelete };

    case 'MOVE_TASK':
      const { taskId: moveTaskId, sourceStatus, destinationStatus, sourceIndex, destinationIndex } = action.payload;
      const tasksAfterMove = { ...state.tasks };
      
      // Find the task
      const taskToMove = tasksAfterMove[sourceStatus][sourceIndex];
      
      // Remove from source
      tasksAfterMove[sourceStatus].splice(sourceIndex, 1);
      
      // Add to destination
      tasksAfterMove[destinationStatus].splice(destinationIndex, 0, {
        ...taskToMove,
        status: destinationStatus
      });
      
      return { ...state, tasks: tasksAfterMove };

    case 'SET_USERS':
      return { ...state, users: action.payload };

    case 'SET_ACTIVITIES':
      return { ...state, activities: action.payload };

    case 'ADD_ACTIVITY':
      return {
        ...state,
        activities: [action.payload, ...state.activities.slice(0, 19)]
      };

    case 'SET_CONFLICT':
      return { ...state, currentConflict: action.payload };

    case 'CLEAR_CONFLICT':
      return { ...state, currentConflict: null };

    case 'SET_EDITING_SESSION':
      return {
        ...state,
        editingSessions: {
          ...state.editingSessions,
          [action.payload.taskId]: action.payload.user
        }
      };

    case 'CLEAR_EDITING_SESSION':
      const newEditingSessions = { ...state.editingSessions };
      delete newEditingSessions[action.payload.taskId];
      return { ...state, editingSessions: newEditingSessions };

    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  // Load initial data
  useEffect(() => {
    if (user) {
      loadTasks();
      loadUsers();
      loadActivities();
    }
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (socket && isConnected) {
      // Real-time task updates
      socket.on('task:created', (data) => {
        dispatch({ type: 'ADD_TASK', payload: data.task });
        if (data.createdBy.id !== user.id) {
          toast.success(`New task "${data.task.title}" created`);
        }
      });

      socket.on('task:updated', (data) => {
        dispatch({ type: 'UPDATE_TASK', payload: data.task });
        if (data.updatedBy.id !== user.id) {
          toast.info(`Task "${data.task.title}" updated`);
        }
      });

      socket.on('task:deleted', (data) => {
        dispatch({ type: 'DELETE_TASK', payload: data.taskId });
        if (data.deletedBy.id !== user.id) {
          toast.info(`Task deleted`);
        }
      });

      socket.on('task:moved', (data) => {
        dispatch({ type: 'UPDATE_TASK', payload: data.task });
        if (data.movedBy.id !== user.id) {
          toast.info(`Task moved to ${data.task.status}`);
        }
      });

      socket.on('conflict:detected', (data) => {
        dispatch({ type: 'SET_CONFLICT', payload: data });
      });

      socket.on('conflict:resolved', () => {
        dispatch({ type: 'CLEAR_CONFLICT' });
        loadTasks(); // Refresh tasks after conflict resolution
      });

      socket.on('task:edit-started', (data) => {
        dispatch({
          type: 'SET_EDITING_SESSION',
          payload: { taskId: data.taskId, user: data.editedBy }
        });
      });

      socket.on('task:edit-ended', (data) => {
        dispatch({
          type: 'CLEAR_EDITING_SESSION',
          payload: { taskId: data.taskId }
        });
      });

      socket.on('activity:new', (activity) => {
        dispatch({ type: 'ADD_ACTIVITY', payload: activity });
      });

      return () => {
        socket.off('task:created');
        socket.off('task:updated');
        socket.off('task:deleted');
        socket.off('task:moved');
        socket.off('conflict:detected');
        socket.off('conflict:resolved');
        socket.off('task:edit-started');
        socket.off('task:edit-ended');
        socket.off('activity:new');
      };
    }
  }, [socket, isConnected, user]);

  // API functions
  const loadTasks = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await tasksAPI.getTasks();
      dispatch({ type: 'SET_TASKS', payload: response.data.tasks });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
      console.error('Failed to load tasks:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getUsers();
      dispatch({ type: 'SET_USERS', payload: response.data.users });
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await activitiesAPI.getActivities({ limit: 20 });
      dispatch({ type: 'SET_ACTIVITIES', payload: response.data.activities });
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const createTask = async (taskData) => {
    try {
      const response = await tasksAPI.createTask(taskData);
      // Task will be added via socket event
      toast.success('Task created successfully');
      return response.data.task;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create task';
      toast.error(message);
      throw error;
    }
  };

  const updateTask = async (taskId, taskData) => {
    try {
      const response = await tasksAPI.updateTask(taskId, taskData);
      // Task will be updated via socket event
      toast.success('Task updated successfully');
      return response.data.task;
    } catch (error) {
      if (error.response?.status === 409) {
        // Conflict detected
        dispatch({ type: 'SET_CONFLICT', payload: error.response.data.conflict });
        return null;
      }
      const message = error.response?.data?.message || 'Failed to update task';
      toast.error(message);
      throw error;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await tasksAPI.deleteTask(taskId);
      // Task will be removed via socket event
      toast.success('Task deleted successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete task';
      toast.error(message);
      throw error;
    }
  };

  const moveTask = async (taskId, status, position, version) => {
    try {
      const response = await tasksAPI.moveTask(taskId, { status, position, version });
      // Task will be updated via socket event
      return response.data.task;
    } catch (error) {
      if (error.response?.status === 409) {
        // Conflict detected
        dispatch({ type: 'SET_CONFLICT', payload: error.response.data.conflict });
        loadTasks(); // Refresh to show correct state
        return null;
      }
      const message = error.response?.data?.message || 'Failed to move task';
      toast.error(message);
      throw error;
    }
  };

  const assignTask = async (taskId, assignedTo, version) => {
    try {
      const response = await tasksAPI.assignTask(taskId, { assignedTo, version });
      toast.success('Task assigned successfully');
      return response.data.task;
    } catch (error) {
      if (error.response?.status === 409) {
        dispatch({ type: 'SET_CONFLICT', payload: error.response.data.conflict });
        return null;
      }
      const message = error.response?.data?.message || 'Failed to assign task';
      toast.error(message);
      throw error;
    }
  };

  const smartAssignTask = async (taskId, version) => {
    try {
      const response = await tasksAPI.smartAssignTask(taskId, { version });
      toast.success(`Task assigned to ${response.data.assignedTo.fullName} via Smart Assign`);
      return response.data.task;
    } catch (error) {
      if (error.response?.status === 409) {
        dispatch({ type: 'SET_CONFLICT', payload: error.response.data.conflict });
        return null;
      }
      const message = error.response?.data?.message || 'Smart assign failed';
      toast.error(message);
      throw error;
    }
  };

  const addComment = async (taskId, text) => {
    try {
      const response = await tasksAPI.addComment(taskId, { text });
      toast.success('Comment added');
      return response.data.task;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add comment';
      toast.error(message);
      throw error;
    }
  };

  const resolveConflict = (resolution) => {
    if (state.currentConflict) {
      socket?.emit('conflict:resolve', {
        taskId: state.currentConflict.taskId,
        resolution,
        conflictId: state.currentConflict.conflictId
      });
      dispatch({ type: 'CLEAR_CONFLICT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    loadTasks,
    loadUsers,
    loadActivities,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    assignTask,
    smartAssignTask,
    addComment,
    resolveConflict,
    clearError
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}