import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../contexts/TaskContext';
import UserAvatar from './UserAvatar';
import './ConflictModal.css';

function ConflictModal() {
  const { currentConflict, resolveConflict } = useTasks();
  const [selectedResolution, setSelectedResolution] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  if (!currentConflict) return null;

  const { 
    clientVersion, 
    serverVersion, 
    serverTask, 
    lastModifiedBy,
    taskTitle 
  } = currentConflict;

  const handleResolve = async (resolution) => {
    setIsResolving(true);
    setSelectedResolution(resolution);
    
    try {
      await resolveConflict(resolution);
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setIsResolving(false);
      setSelectedResolution(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getVersionDifferences = () => {
    // This would normally show field-by-field differences
    // For now, we'll show basic version info
    return [
      {
        field: 'Version',
        yours: clientVersion,
        theirs: serverVersion,
        hasConflict: true
      },
      {
        field: 'Last Modified',
        yours: 'Your changes',
        theirs: formatDate(serverTask.lastModified),
        hasConflict: false
      }
    ];
  };

  const differences = getVersionDifferences();

  return (
    <AnimatePresence>
      <motion.div
        className="conflict-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="conflict-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="header-icon">⚠️</div>
            <div className="header-content">
              <h2 className="modal-title">Conflict Detected</h2>
              <p className="modal-subtitle">
                Task "{taskTitle}" was modified by another user while you were editing
              </p>
            </div>
          </div>

          {/* Conflict Details */}
          <div className="conflict-details">
            <div className="conflict-info">
              <div className="version-info">
                <div className="version-item yours">
                  <span className="version-label">Your Version</span>
                  <span className="version-number">v{clientVersion}</span>
                </div>
                <div className="conflict-arrow">→</div>
                <div className="version-item theirs">
                  <span className="version-label">Server Version</span>
                  <span className="version-number">v{serverVersion}</span>
                </div>
              </div>

              {lastModifiedBy && (
                <div className="modified-by">
                  <span>Last modified by:</span>
                  <div className="user-info">
                    <UserAvatar user={lastModifiedBy} size="small" />
                    <span className="user-name">{lastModifiedBy.fullName}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Differences */}
            <div className="differences-section">
              <h3 className="differences-title">Changes Detected</h3>
              <div className="differences-list">
                {differences.map((diff, index) => (
                  <div 
                    key={index} 
                    className={`difference-item ${diff.hasConflict ? 'conflict' : ''}`}
                  >
                    <div className="field-name">{diff.field}</div>
                    <div className="field-comparison">
                      <div className="field-value yours">
                        <label>Your version:</label>
                        <span>{diff.yours}</span>
                      </div>
                      <div className="field-value theirs">
                        <label>Their version:</label>
                        <span>{diff.theirs}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resolution Options */}
          <div className="resolution-options">
            <h3 className="resolution-title">How would you like to resolve this conflict?</h3>
            
            <div className="resolution-buttons">
              <button
                className="resolution-button merge"
                onClick={() => handleResolve('merge')}
                disabled={isResolving}
              >
                <div className="button-icon">🔀</div>
                <div className="button-content">
                  <div className="button-title">Smart Merge</div>
                  <div className="button-description">
                    Automatically combine changes where possible
                  </div>
                </div>
                {selectedResolution === 'merge' && isResolving && (
                  <div className="button-spinner">⏳</div>
                )}
              </button>

              <button
                className="resolution-button overwrite"
                onClick={() => handleResolve('overwrite')}
                disabled={isResolving}
              >
                <div className="button-icon">✏️</div>
                <div className="button-content">
                  <div className="button-title">Use My Changes</div>
                  <div className="button-description">
                    Keep your version and discard their changes
                  </div>
                </div>
                {selectedResolution === 'overwrite' && isResolving && (
                  <div className="button-spinner">⏳</div>
                )}
              </button>

              <button
                className="resolution-button cancel"
                onClick={() => handleResolve('cancel')}
                disabled={isResolving}
              >
                <div className="button-icon">↩️</div>
                <div className="button-content">
                  <div className="button-title">Use Their Changes</div>
                  <div className="button-description">
                    Keep their version and discard your changes
                  </div>
                </div>
                {selectedResolution === 'cancel' && isResolving && (
                  <div className="button-spinner">⏳</div>
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="footer-note">
              <strong>Note:</strong> This action cannot be undone. The chosen resolution will be applied immediately.
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ConflictModal;