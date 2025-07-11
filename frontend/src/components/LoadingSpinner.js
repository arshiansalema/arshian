import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner({ size = 'medium', text = 'Loading...', className = '' }) {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  }[size];

  return (
    <div className={`loading-spinner ${className}`}>
      <div className={`spinner ${sizeClass}`}>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
      </div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;