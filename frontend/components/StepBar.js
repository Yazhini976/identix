import React from 'react';

export default function StepBar({ current, style }) {
  const steps = ['Sign Up', 'Capture', 'Liveness', 'Dashboard'];
  return (
    <div className="steps" style={style}>
      {steps.map((label, i) => {
        const n = i + 1;
        const isDone = n < current;
        const isActive = n === current;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="step-dot">
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : n}
              </div>
              <span className="step-label">{label}</span>
            </div>
            {i < steps.length - 1 && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
}
