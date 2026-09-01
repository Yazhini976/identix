import React from 'react';

export default function Wordmark({ style }) {
  return (
    <div className="wordmark" style={style}>
      <div className="wordmark-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L3 6v4c0 3.9 2.9 7.5 7 8.5 4.1-1 7-4.6 7-8.5V6L10 2z" fill="white" fillOpacity="0.9" />
        </svg>
      </div>
      <span className="wordmark-text">IDentix</span>
    </div>
  );
}
