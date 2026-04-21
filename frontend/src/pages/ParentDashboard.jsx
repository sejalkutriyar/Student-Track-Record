import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import IncomingCall from '../components/IncomingCall';
import VideoCall from '../components/VideoCall';
import './ParentDashboard.css';

// const API = 'http://localhost:5000/api';
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ParentDashboard = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [marks, setMarks] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [gpa, setGpa] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/students`, { headers });
      const myStudents = res.data.filter(s => s.parent_id === user.id);
      setStudents(myStudents);
      setStudents(currentStudents => {
        if (myStudents.length > 0 && (!selectedStudent || !myStudents.find(s => s.id === selectedStudent.id))) {
          setSelectedStudent(myStudents[0]);
          fetchStudentData(myStudents[0].id);
        }
        return myStudents;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudentData = async (studentId) => {
    try {
      const attRes = await axios.get(`${API}/attendance/${studentId}/percentage`, { headers });
      setAttendance(attRes.data);
    } catch (err) {
      console.log('Attendance not found');
    }

    try {
      const marksRes = await axios.get(`${API}/marks/${studentId}`, { headers });
      setMarks(marksRes.data);
    } catch (err) {
      console.log('Marks not found');
    }

    try {
      const remarksRes = await axios.get(`${API}/remarks/${studentId}`, { headers });
      setRemarks(remarksRes.data);
    } catch (err) {
      console.log('Remarks not found');
    }

    try {
      const gpaRes = await axios.get(`${API}/marks/${studentId}/gpa?exam_type=midterm`, { headers });
      setGpa(gpaRes.data);
    } catch (err) {
      console.log('GPA not found');
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentData(selectedStudent.id);
    }
  }, [selectedStudent]);

  useEffect(() => {
    fetchStudents();
    const interval = setInterval(() => {
      fetchStudents();
      if (selectedStudent) {
        fetchStudentData(selectedStudent.id);
      }
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent]);

  useEffect(() => {
    if (!user) return;

    socket.connect();

    const onConnect = () => {
      console.log('Parent Socket connected:', socket.id);
      socket.emit('register', user.id);
    };

    socket.on('connect', onConnect);
    if (socket.connected) {
      onConnect();
    }

    const onCallIncoming = ({ fromSocketId, fromName, studentName }) => {
      console.log('Incoming call from:', fromName);
      setIncomingCall({ fromSocketId, fromName, studentName });
    };

    socket.on('call:incoming', onCallIncoming);

    return () => {
      socket.off('connect', onConnect);
      socket.off('call:incoming', onCallIncoming);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FIXED — sirf state set karo, JSX yahan nahi
  const handleAccept = () => {
    setActiveCall({
      fromSocketId: incomingCall.fromSocketId,
      fromName: incomingCall.fromName,
      studentName: incomingCall.studentName
    });
    setIncomingCall(null);
  };

  const handleDecline = () => {
    socket.emit('call:declined', { toSocketId: incomingCall.fromSocketId });
    setIncomingCall(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    socket.disconnect();
    navigate('/login');
  };

  const handleDownloadReport = async () => {
    try {
      const res = await axios.get(`${API}/reports/${selectedStudent.id}`, {
        headers,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedStudent.name}_ReportCard.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Error downloading report');
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return '#38a169';
    return '#e53e3e';
  };

  return (
    <div className="parent-container">

      {/* ✅ VideoCall — accept ke baad dikhega */}
      {activeCall && (
        <VideoCall
          currentUser={user}
          isCaller={false}
          peerSocketId={activeCall.fromSocketId}
          targetName={activeCall.fromName}
          onClose={() => setActiveCall(null)}
        />
      )}

      {/* Incoming Call Popup */}
      {incomingCall && (
        <IncomingCall
          callerName={incomingCall.fromName}
          studentName={incomingCall.studentName}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}

      {/* Sidebar */}
      <div className="parent-sidebar">
        <div className="sidebar-logo">📚 EduTrack</div>
        <nav className="sidebar-nav">
          <button className={activeTab === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('overview')}>🏠 Overview</button>
          <button className={activeTab === 'attendance' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('attendance')}>📋 Attendance</button>
          <button className={activeTab === 'marks' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('marks')}>📊 Marks</button>
          <button className={activeTab === 'remarks' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('remarks')}>📝 Teacher Remarks</button>
          <button className={activeTab === 'report' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('report')}>📄 Report Card</button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">👨‍👩‍👧 {user?.name}</div>
          <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="parent-main">

        <div className="parent-header">
          <h1 className="page-title">
            {activeTab === 'overview' && '🏠 Overview'}
            {activeTab === 'attendance' && '📋 Attendance'}
            {activeTab === 'marks' && '📊 Marks'}
            {activeTab === 'remarks' && '📝 Teacher Remarks'}
            {activeTab === 'report' && '📄 Report Card'}
          </h1>
          {students.length > 0 && (
            <select 
              className="student-badge"
              style={{
                background: '#111827',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '8px 16px',
                borderRadius: '20px',
                outline: 'none',
                cursor: 'pointer'
              }}
              value={selectedStudent?.id || ''}
              onChange={(e) => {
                const s = students.find(x => x.id === parseInt(e.target.value));
                setSelectedStudent(s);
                fetchStudentData(s.id);
              }}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  👤 {s.name} (Class {s.class}-{s.section})
                </option>
              ))}
            </select>
          )}
        </div>

        {students.length === 0 && (
          <div className="empty-state">
            <p>No students linked to your account.</p>
          </div>
        )}

        {activeTab === 'overview' && selectedStudent && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Attendance</div>
                <div className="stat-value" style={{ color: getAttendanceColor(attendance?.percentage) }}>
                  {attendance?.percentage || 0}%
                </div>
                <div className="stat-sub">{attendance?.present_days} / {attendance?.total_days} days</div>
                {attendance?.percentage < 75 && (
                  <div className="alert-badge">⚠ Below 75%</div>
                )}
              </div>
              <div className="stat-card">
                <div className="stat-label">GPA</div>
                <div className="stat-value">{gpa?.gpa || 'N/A'}</div>
                <div className="stat-sub">Grade: {gpa?.grade || 'N/A'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Overall %</div>
                <div className="stat-value">{gpa?.overall_percentage || 'N/A'}%</div>
                <div className="stat-sub">Mid Term</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Subjects</div>
                <div className="stat-value">{marks.length}</div>
                <div className="stat-sub">Total subjects</div>
              </div>
            </div>
            <button className="btn-primary" onClick={handleDownloadReport}>
              📄 Download Report Card
            </button>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="info-card">
            <h3>Attendance Summary</h3>
            <div className="attendance-summary">
              <div className="att-item">
                <span className="att-label">Total Days</span>
                <span className="att-value">{attendance?.total_days || 0}</span>
              </div>
              <div className="att-item">
                <span className="att-label">Present</span>
                <span className="att-value present">{attendance?.present_days || 0}</span>
              </div>
              <div className="att-item">
                <span className="att-label">Absent</span>
                <span className="att-value absent">
                  {(attendance?.total_days - attendance?.present_days) || 0}
                </span>
              </div>
              <div className="att-item">
                <span className="att-label">Percentage</span>
                <span className="att-value" style={{ color: getAttendanceColor(attendance?.percentage) }}>
                  {attendance?.percentage || 0}%
                </span>
              </div>
            </div>
            {attendance?.percentage < 75 && (
              <div className="warning-box">
                ⚠️ Attendance is below 75%. Please ensure regular attendance.
              </div>
            )}
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="info-card">
            <h3>Subject-wise Marks</h3>
            <table className="data-table">
              <thead>
                <tr><th>Subject</th><th>Exam</th><th>Marks</th><th>Max</th><th>%</th></tr>
              </thead>
              <tbody>
                {marks.map((m, i) => (
                  <tr key={i}>
                    <td>{m.subject}</td>
                    <td>{m.exam_type}</td>
                    <td>{m.marks_obtained}</td>
                    <td>{m.max_marks}</td>
                    <td>{((m.marks_obtained / m.max_marks) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {gpa && (
              <div className="gpa-summary">
                <span>GPA: <strong>{gpa.gpa}</strong></span>
                <span>Grade: <strong>{gpa.grade}</strong></span>
                <span>Overall: <strong>{gpa.overall_percentage}%</strong></span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'remarks' && (
          <div className="info-card">
            <h3>Teacher Remarks</h3>
            {remarks.length === 0 ? (
              <p style={{ color: '#888' }}>No remarks found for {selectedStudent?.name}.</p>
            ) : (
              <div>
                {remarks.map(r => (
                  <div key={r.id} style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    marginBottom: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background: r.remark_type === 'achievement' ? 'rgba(56, 161, 105, 0.2)' :
                                    r.remark_type === 'behavioral' ? 'rgba(229, 62, 62, 0.2)' : 'rgba(102, 126, 234, 0.2)',
                        color: r.remark_type === 'achievement' ? '#38a169' :
                               r.remark_type === 'behavioral' ? '#fc8181' : '#90cdf4'
                      }}>
                        {r.remark_type === 'achievement' ? '🏆' :
                         r.remark_type === 'behavioral' ? '⚠️' : '📚'} {r.remark_type}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '15px', color: '#f8fafc', marginBottom: '8px' }}>{r.remark_text}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Given By: <strong>{r.teacher_name}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="info-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
            <h3>Report Card</h3>
            <p style={{ color: '#888', marginBottom: '24px' }}>
              Download {selectedStudent?.name}'s complete report card.
            </p>
            <button className="btn-primary" onClick={handleDownloadReport}>
              ⬇ Download PDF Report Card
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ParentDashboard;