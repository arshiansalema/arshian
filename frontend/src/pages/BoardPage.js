import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../contexts/TaskContext';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import ConflictModal from '../components/ConflictModal';
import ActivityFeed from '../components/ActivityFeed';
import LoadingSpinner from '../components/LoadingSpinner';
import './BoardPage.css';

const COLUMN_CONFIG = {
  todo: {
    title: 'To Do',
    icon: '📝',
    color: 'var(--gray-500)'
  },
  'in-progress': {
    title: 'In Progress',
    icon: '⚡',
    color: 'var(--warning)'
  },
  done: {
    title: 'Done',
    icon: '✅',
    color: 'var(--success)'
  }
};

function BoardPage() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isActivityFeedOpen, setIsActivityFeedOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const { 
    tasks, 
    users, 
    loading, 
    error, 
    createTask, 
    updateTask, 
    deleteTask, 
    moveTask, 
    smartAssignTask,
    editingSessions 
  } = useTasks();

  const { isConnected } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    // Subscribe to activity feed when component mounts
    return () => {
      // Cleanup on unmount
    };
  }, []);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // No destination (dropped outside)
    if (!destination) {
      return;
    }

    // Same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destinationStatus = destination.droppableId;
    const taskId = draggableId;

    // Find the task to get its version
    const task = Object.values(tasks)
      .flat()
      .find(t => t._id === taskId);

    if (!task) return;

    try {
      await moveTask(taskId, destinationStatus, destination.index, task.version);
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await createTask(taskData);
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      const task = Object.values(tasks)
        .flat()
        .find(t => t._id === taskId);
      
      await updateTask(taskId, { ...taskData, version: task.version });
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setIsTaskModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleSmartAssign = async (taskId) => {
    try {
      const task = Object.values(tasks)
        .flat()
        .find(t => t._id === taskId);
      
      await smartAssignTask(taskId, task.version);
    } catch (error) {
      console.error('Failed to smart assign task:', error);
    }
  };

  const openTaskModal = (task = null) => {
    setSelectedTask(task);
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setEditingTask(null);
  };

  const getTaskStats = () => {
    const allTasks = Object.values(tasks).flat();
    return {
      total: allTasks.length,
      todo: tasks.todo.length,
      inProgress: tasks['in-progress'].length,
      done: tasks.done.length,
      assigned: allTasks.filter(task => task.assignedTo?.id === user.id).length
    };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="board-page">
        <Navbar />
        <div className="board-loading">
          <LoadingSpinner size="large" text="Loading your board..." />
        </div>
      </div>
    );
  }

  return (
    <div className="board-page">
      <Navbar />
      
      {/* Board Header */}
      <div className="board-header">
        <div className="board-header-content">
          <div className="board-title-section">
            <h1 className="board-title">My Board</h1>
            <div className="board-stats">
              <div className="stat-item">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.assigned}</span>
                <span className="stat-label">Assigned to me</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.done}</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>
          </div>

          <div className="board-actions">
            <button
              className="activity-toggle"
              onClick={() => setIsActivityFeedOpen(!isActivityFeedOpen)}
            >
              <span className="action-icon">📊</span>
              Activity
            </button>
            
            <button
              className="create-task-button"
              onClick={() => openTaskModal()}
            >
              <span className="action-icon">➕</span>
              New Task
            </button>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="connection-warning">
            <span className="warning-icon">⚠️</span>
            Connection lost. Some features may not work properly.
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span className="error-icon">❌</span>
            {error}
          </div>
        )}
      </div>

      {/* Board Content */}
      <div className="board-content">
        <div className="board-main">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="kanban-board">
              {Object.entries(COLUMN_CONFIG).map(([status, config]) => (
                <div key={status} className="kanban-column">
                  <div className="column-header">
                    <div className="column-title">
                      <span className="column-icon">{config.icon}</span>
                      <span className="column-name">{config.title}</span>
                      <span className="task-count">{tasks[status]?.length || 0}</span>
                    </div>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                      >
                        <AnimatePresence>
                          {tasks[status]?.map((task, index) => (
                            <Draggable
                              key={task._id}
                              draggableId={task._id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <motion.div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`task-card-wrapper ${snapshot.isDragging ? 'dragging' : ''}`}
                                  style={{
                                    ...provided.draggableProps.style,
                                  }}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  transition={{ duration: 0.2 }}
                                  layout
                                >
                                  <TaskCard
                                    task={task}
                                    onEdit={() => openTaskModal(task)}
                                    onDelete={() => handleDeleteTask(task._id)}
                                    onSmartAssign={() => handleSmartAssign(task._id)}
                                    isBeingEdited={editingSessions[task._id]}
                                    currentUser={user}
                                    users={users}
                                  />
                                </motion.div>
                              )}
                            </Draggable>
                          ))}
                        </AnimatePresence>
                        {provided.placeholder}

                        {/* Empty State */}
                        {tasks[status]?.length === 0 && (
                          <div className="empty-column">
                            <div className="empty-icon">{config.icon}</div>
                            <p className="empty-text">
                              {status === 'todo' ? 'No tasks yet' : 
                               status === 'in-progress' ? 'No tasks in progress' : 
                               'No completed tasks'}
                            </p>
                            {status === 'todo' && (
                              <button
                                className="empty-action"
                                onClick={() => openTaskModal()}
                              >
                                Create your first task
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>

        {/* Activity Feed */}
        <AnimatePresence>
          {isActivityFeedOpen && (
            <motion.div
              className="activity-sidebar"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <ActivityFeed onClose={() => setIsActivityFeedOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <TaskModal
            task={editingTask}
            users={users}
            onSave={editingTask ? 
              (data) => handleUpdateTask(editingTask._id, data) : 
              handleCreateTask
            }
            onClose={closeTaskModal}
          />
        )}
      </AnimatePresence>

      <ConflictModal />
    </div>
  );
}

export default BoardPage;