import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

const API = 'http://localhost:5000/api';

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Students fetch
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">📚 EduTrack</div>
        <nav className="sidebar-nav">
          <button className={activeTab === 'students' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('students')}>👥 Students</button>
          <button className={activeTab === 'attendance' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('attendance')}>📋 Attendance</button>
          <button className={activeTab === 'marks' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('marks')}>📊 Marks</button>
          <button className={activeTab === 'reports' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveTab('reports')}>📄 Reports</button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">🧑‍🏫 {user?.name}</div>
          <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">

        {/* Header */}
        <div className="dashboard-header">
          <h1 className="page-title">
            {activeTab === 'students' && '👥 Students'}
            {activeTab === 'attendance' && '📋 Attendance'}
            {activeTab === 'marks' && '📊 Marks'}
            {activeTab === 'reports' && '📄 Reports'}
          </h1>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <StudentsTab students={students} headers={headers} fetchStudents={fetchStudents} />
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <AttendanceTab students={students} headers={headers} />
        )}

        {/* Marks Tab */}
        {activeTab === 'marks' && (
          <MarksTab students={students} headers={headers} />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsTab students={students} token={token} />
        )}

      </div>
    </div>
  );
};

// ── Students Tab ──
const StudentsTab = ({ students, headers, fetchStudents }) => {
  const [form, setForm] = useState({ name: '', roll_number: '', class: '', section: '', dob: '', parent_id: '' });
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/students', form, { headers });
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
      await axios.delete(`http://localhost:5000/api/students/${id}`, { headers });
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
            <input placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <input placeholder="Roll Number" value={form.roll_number} onChange={e => setForm({...form, roll_number: e.target.value})} required />
            <input placeholder="Class (e.g. 10)" value={form.class} onChange={e => setForm({...form, class: e.target.value})} />
            <input placeholder="Section (e.g. A)" value={form.section} onChange={e => setForm({...form, section: e.target.value})} />
            <input type="date" placeholder="Date of Birth" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
            <input placeholder="Parent ID" value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})} />
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
                <td>
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
        await axios.post('http://localhost:5000/api/attendance',
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
                    <button
                      className={attendance[s.id] === 'present' ? 'btn-present active' : 'btn-present'}
                      onClick={() => handleMark(s.id, 'present')}>Present</button>
                    <button
                      className={attendance[s.id] === 'absent' ? 'btn-absent active' : 'btn-absent'}
                      onClick={() => handleMark(s.id, 'absent')}>Absent</button>
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
      await axios.post('http://localhost:5000/api/marks', form, { headers });
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
          <select value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} required>
            <option value="">Select Student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input placeholder="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
          <select value={form.exam_type} onChange={e => setForm({...form, exam_type: e.target.value})}>
            <option value="midterm">Mid Term</option>
            <option value="final">Final</option>
            <option value="unit">Unit Test</option>
          </select>
          <input type="number" placeholder="Marks Obtained" value={form.marks_obtained} onChange={e => setForm({...form, marks_obtained: e.target.value})} required />
          <input type="number" placeholder="Max Marks" value={form.max_marks} onChange={e => setForm({...form, max_marks: e.target.value})} required />
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
      const res = await axios.get(`http://localhost:5000/api/reports/${studentId}`, {
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

export default TeacherDashboard;