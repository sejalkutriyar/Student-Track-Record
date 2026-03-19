import React from 'react';
import './IncomingCall.css';

const IncomingCall = ({ callerName, studentName, onAccept, onDecline }) => {
  return (
    <div className="incoming-overlay">
      <div className="incoming-card">
        <div className="incoming-ring">📹</div>
        <h3 className="incoming-title">Incoming Call</h3>
        <p className="incoming-caller">{callerName}</p>
        <p className="incoming-student">Regarding: {studentName}</p>
        <div className="incoming-buttons">
          <button className="btn-decline" onClick={onDecline}>✕ Decline</button>
          <button className="btn-accept" onClick={onAccept}>✓ Accept</button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall;