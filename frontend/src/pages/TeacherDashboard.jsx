import React, { useState, useEffect } from 'react';
import VideoCall from '../components/VideoCall';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import './TeacherDashboard.css';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register( CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend );

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/students`, { headers });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!user) return;

    socket.connect();

    const onConnect = () => {
      console.log('Teacher Socket connected:', socket.id);
      socket.emit('register', user.id);
    };

    socket.on('connect', onConnect);
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    socket.disconnect();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">

      {/* Video Call Modal */}
      {activeCall && (
        <VideoCall
          currentUser={user}
          isCaller={true}
          targetUserId={activeCall.userId}
          targetName={activeCall.name}
          onClose={() => setActiveCall(null)}
        />
      )}

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">📚 EduTrack</div>
        <nav className="sidebar-nav">
          <button className={activeTab === 'students' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('students')}>👥 Students</button>
          <button className={activeTab === 'attendance' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('attendance')}>📋 Attendance</button>
          <button className={activeTab === 'marks' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('marks')}>📊 Marks</button>
          <button className={activeTab === 'reports' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('reports')}>📄 Reports</button>
          <button className={activeTab === 'remarks' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('remarks')}>📝 Remarks</button>
          <button className={activeTab === 'charts' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('charts')}>📊 Charts</button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">🧑‍🏫 {user?.name}</div>
          <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="dashboard-header">
          <h1 className="page-title">
            {activeTab === 'students' && '👥 Students'}
            {activeTab === 'attendance' && '📋 Attendance'}
            {activeTab === 'marks' && '📊 Marks'}
            {activeTab === 'reports' && '📄 Reports'}
            {activeTab === 'remarks' && '📝 Remarks'}
            {activeTab === 'charts' && '📊 Performance Charts'}
          </h1>
        </div>

        {activeTab === 'students' && (
          <StudentsTab
            students={students}
            headers={headers}
            fetchStudents={fetchStudents}
            onCall={(student) => setActiveCall({ userId: student.parent_id, name: student.name })}
          />
        )}
        {activeTab === 'attendance' && <AttendanceTab students={students} headers={headers} />}
        {activeTab === 'marks' && <MarksTab students={students} headers={headers} />}
        {activeTab === 'reports' && <ReportsTab students={students} token={token} />}
        {activeTab === 'remarks' && <RemarksTab students={students} headers={headers} />}
        {activeTab === 'charts' && <ChartsTab students={students} headers={headers} />}
      </div>
    </div>
  );
};

// ── Students Tab ──
const StudentsTab = ({ students, headers, fetchStudents, onCall }) => {
  const [form, setForm] = useState({ name: '', roll_number: '', class: '', section: '', dob: '', parent_id: '' });
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/students`, form, { headers });
      fetchStudents();
      setShowForm(false);
      setForm({ name: '', roll_number: '', class: '', section: '', dob: '', parent_id: '' });
    } catch (err) {
      alert('Error: ' + err.response?.data?.error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await axios.delete(`${API}/students/${id}`, { headers });
      fetchStudents();
    } catch (err) {
      alert('Error deleting student');
    }
  };

  return (
    <div>
      <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? '✕ Cancel' : '+ Add Student'}
      </button>

      {showForm && (
        <form className="form-card" onSubmit={handleAdd}>
          <h3>Add New Student</h3>
          <div className="form-grid">
            <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="Roll Number" value={form.roll_number} onChange={e => setForm({ ...form, roll_number: e.target.value })} required />
            <input placeholder="Class (e.g. 10)" value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} />
            <input placeholder="Section (e.g. A)" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} />
            <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} />
            <input placeholder="Parent ID" value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary">Save Student</button>
        </form>
      )}

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th><th>Roll No.</th><th>Class</th><th>Section</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.roll_number}</td>
                <td>{s.class}</td>
                <td>{s.section}</td>
                <td style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-call btn-sm"
                    onClick={() => onCall(s)}
                  >
                    📹 Call
                  </button>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Attendance Tab ──
const AttendanceTab = ({ students, headers }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [message, setMessage] = useState('');

  const handleMark = (studentId, status) => {
    setAttendance({ ...attendance, [studentId]: status });
  };

  const handleSubmit = async () => {
    try {
      for (const [student_id, status] of Object.entries(attendance)) {
        await axios.post(`${API}/attendance`,
          { student_id: parseInt(student_id), date, status },
          { headers }
        );
      }
      setMessage('✅ Attendance submitted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error submitting attendance');
    }
  };

  return (
    <div>
      <div className="date-selector">
        <label>Date: </label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="date-input" />
        <button className="btn-primary" onClick={handleSubmit}>Submit Attendance</button>
      </div>
      {message && <div className="alert-msg">{message}</div>}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Roll No.</th><th>Status</th></tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.roll_number}</td>
                <td>
                  <div className="attendance-btns">
                    <button className={attendance[s.id] === 'present' ? 'btn-present active' : 'btn-present'} onClick={() => handleMark(s.id, 'present')}>Present</button>
                    <button className={attendance[s.id] === 'absent' ? 'btn-absent active' : 'btn-absent'} onClick={() => handleMark(s.id, 'absent')}>Absent</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Marks Tab ──
const MarksTab = ({ students, headers }) => {
  const [form, setForm] = useState({ student_id: '', subject: '', exam_type: 'midterm', marks_obtained: '', max_marks: 100 });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/marks`, form, { headers });
      setMessage('✅ Marks added successfully!');
      setTimeout(() => setMessage(''), 3000);
      setForm({ student_id: '', subject: '', exam_type: 'midterm', marks_obtained: '', max_marks: 100 });
    } catch (err) {
      setMessage('❌ Error: ' + err.response?.data?.error);
    }
  };

  return (
    <div>
      <form className="form-card" onSubmit={handleSubmit}>
        <h3>Enter Marks</h3>
        {message && <div className="alert-msg">{message}</div>}
        <div className="form-grid">
          <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} required>
            <option value="">Select Student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
          <select value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })}>
            <option value="midterm">Mid Term</option>
            <option value="final">Final</option>
            <option value="unit">Unit Test</option>
          </select>
          <input type="number" placeholder="Marks Obtained" value={form.marks_obtained} onChange={e => setForm({ ...form, marks_obtained: e.target.value })} required />
          <input type="number" placeholder="Max Marks" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} required />
        </div>
        <button type="submit" className="btn-primary">Add Marks</button>
      </form>
    </div>
  );
};

// ── Reports Tab ──
const ReportsTab = ({ students, token }) => {
  const handleDownload = async (studentId, studentName) => {
    try {
      const res = await axios.get(`${API}/reports/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${studentName}_ReportCard.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      alert('Error generating report');
    }
  };

  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr><th>Name</th><th>Roll No.</th><th>Class</th><th>Report Card</th></tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.roll_number}</td>
              <td>{s.class}-{s.section}</td>
              <td>
                <button className="btn-primary btn-sm" onClick={() => handleDownload(s.id, s.name)}>
                  📄 Download PDF
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Remarks Tab ──
const RemarksTab = ({ students, headers }) => {
  const [form, setForm] = useState({
    student_id: '',
    remark_text: '',
    remark_type: 'academic'
  });
  const [remarks, setRemarks] = useState([]);
  const [message, setMessage] = useState('');

  const fetchRemarks = async (studentId) => {
    if (!studentId) return;
    try {
      const res = await axios.get(
        `${API}/remarks/${studentId}`,
        { headers }
      );
      setRemarks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/remarks`, form, { headers });
      setMessage('✅ Remark added!');
      fetchRemarks(form.student_id);
      setTimeout(() => setMessage(''), 3000);
      setForm({ ...form, remark_text: '' });
    } catch (err) {
      setMessage('❌ Error adding remark');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/remarks/${id}`, { headers });
      setRemarks(remarks.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <form className="form-card" onSubmit={handleSubmit}>
        <h3>Add Remark</h3>
        {message && <div className="alert-msg">{message}</div>}
        <div className="form-grid">
          <select
            value={form.student_id}
            onChange={e => {
              setForm({ ...form, student_id: e.target.value });
              fetchRemarks(e.target.value);
            }}
            required
          >
            <option value="">Select Student</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={form.remark_type}
            onChange={e => setForm({ ...form, remark_type: e.target.value })}
          >
            <option value="academic">📚 Academic</option>
            <option value="behavioral">⚠️ Behavioral</option>
            <option value="achievement">🏆 Achievement</option>
          </select>
        </div>
        <textarea
          placeholder="Write remark here..."
          value={form.remark_text}
          onChange={e => setForm({ ...form, remark_text: e.target.value })}
          required
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1.5px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            minHeight: '100px',
            marginBottom: '12px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
        <button type="submit" className="btn-primary">Add Remark</button>
      </form>

      {remarks.length > 0 && (
        <div className="table-card">
          <h3 style={{ marginBottom: '16px' }}>Previous Remarks</h3>
          {remarks.map(r => (
            <div key={r.id} style={{
              padding: '14px 16px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    background: r.remark_type === 'achievement' ? '#e6f7ef' :
                                r.remark_type === 'behavioral' ? '#fff0f0' : '#e8f4ff',
                    color: r.remark_type === 'achievement' ? '#38a169' :
                           r.remark_type === 'behavioral' ? '#e53e3e' : '#667eea'
                  }}>
                    {r.remark_type === 'achievement' ? '🏆' :
                     r.remark_type === 'behavioral' ? '⚠️' : '📚'} {r.remark_type}
                  </span>
                  <span style={{ fontSize: '11px', color: '#888' }}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#333' }}>{r.remark_text}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  By: {r.teacher_name}
                </div>
              </div>
              <button
                className="btn-danger btn-sm"
                onClick={() => handleDelete(r.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Charts Tab ──
const ChartsTab = ({ students, headers }) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [marksData, setMarksData] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchChartData = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const marksRes = await axios.get(
        `${API}/marks/${studentId}`,
        { headers }
      );
      setMarksData(marksRes.data);

      const attRes = await axios.get(
        `${API}/attendance/${studentId}/percentage`,
        { headers }
      );
      setAttendanceData(attRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const marksChartData = {
    labels: marksData.map(m => m.subject),
    datasets: [{
      label: 'Marks Obtained',
      data: marksData.map(m => m.marks_obtained),
      backgroundColor: marksData.map(m => {
        const pct = (m.marks_obtained / m.max_marks) * 100;
        if (pct >= 75) return 'rgba(56, 161, 105, 0.7)';
        if (pct >= 50) return 'rgba(102, 126, 234, 0.7)';
        return 'rgba(229, 62, 62, 0.7)';
      }),
      borderColor: marksData.map(m => {
        const pct = (m.marks_obtained / m.max_marks) * 100;
        if (pct >= 75) return '#38a169';
        if (pct >= 50) return '#667eea';
        return '#e53e3e';
      }),
      borderWidth: 2,
      borderRadius: 6,
    }]
  };

  const attendanceChartData = {
    labels: ['Present', 'Absent'],
    datasets: [{
      data: [
        attendanceData?.present_days || 0,
        (attendanceData?.total_days - attendanceData?.present_days) || 0
      ],
      backgroundColor: ['rgba(56, 161, 105, 0.7)', 'rgba(229, 62, 62, 0.7)'],
      borderColor: ['#38a169', '#e53e3e'],
      borderWidth: 2,
    }]
  };

  return (
    <div>
      {/* Student selector */}
      <div className="form-card" style={{ marginBottom: '20px' }}>
        <select
          value={selectedStudent}
          onChange={e => {
            setSelectedStudent(e.target.value);
            fetchChartData(e.target.value);
          }}
          style={{
            padding: '10px 14px',
            border: '1.5px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            width: '300px'
          }}
        >
          <option value="">Select Student to view charts</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading charts...</div>}

      {selectedStudent && !loading && (
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Marks Bar Chart */}
          <div className="table-card">
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>📊 Subject-wise Marks</h3>
            {marksData.length > 0 ? (
              <Bar
                data={marksChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => `${ctx.raw} / ${marksData[ctx.dataIndex]?.max_marks}`
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      grid: { color: '#f0f0f0' }
                    },
                    x: { grid: { display: false } }
                  }
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No marks data</div>
            )}
          </div>

          {/* Attendance Doughnut Chart */}
          <div className="table-card">
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>📋 Attendance Overview</h3>
            {attendanceData?.total_days > 0 ? (
              <div style={{ maxWidth: '250px', margin: '0 auto' }}>
                <Doughnut
                  data={attendanceChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom' },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => `${ctx.label}: ${ctx.raw} days`
                        }
                      }
                    }
                  }}
                />
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '18px', fontWeight: '700', color: attendanceData?.percentage >= 75 ? '#38a169' : '#e53e3e' }}>
                  {attendanceData?.percentage}% Attendance
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No attendance data</div>
            )}
          </div>

          {/* Marks Summary Table */}
          {marksData.length > 0 && (
            <div className="table-card" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>📈 Performance Summary</h3>
              <table className="data-table">
                <thead>
                  <tr><th>Subject</th><th>Marks</th><th>Max</th><th>Percentage</th><th>Grade</th></tr>
                </thead>
                <tbody>
                  {marksData.map((m, i) => {
                    const pct = ((m.marks_obtained / m.max_marks) * 100).toFixed(1);
                    const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'D';
                    return (
                      <tr key={i}>
                        <td>{m.subject}</td>
                        <td>{m.marks_obtained}</td>
                        <td>{m.max_marks}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 75 ? '#38a169' : pct >= 50 ? '#667eea' : '#e53e3e', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '12px', color: '#555' }}>{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            background: grade === 'A+' || grade === 'A' ? '#e6f7ef' : grade === 'B+' || grade === 'B' ? '#e8f4ff' : '#fff0f0',
                            color: grade === 'A+' || grade === 'A' ? '#38a169' : grade === 'B+' || grade === 'B' ? '#667eea' : '#e53e3e'
                          }}>
                            {grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;