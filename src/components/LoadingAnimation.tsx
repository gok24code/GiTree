// src/components/LoadingAnimation.tsx
import React from 'react';
import './LoadingAnimation.css';

const LoadingAnimation: React.FC = () => {
  return (
    <div className="loading-animation-container">
      <div className="dot dot-1"></div>
      <div className="dot dot-2"></div>
      <div className="dot dot-3"></div>
    </div>
  );
};

export default LoadingAnimation;