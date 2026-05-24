import React, { useState } from 'react';
import { useGetDailyReportQuery } from '../features/attendance/attendanceApi';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';

const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--';

const ReportsPage = () => {
  const user = useSelector(selectCurrentUser);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSelfie, setShowSelfie] = useState(null);

  const { data, isLoading } = useGetDailyReportQuery({ date });
  const report = data?.report || [];

  const printReport = () => window.print();

  const getShiftClass = (s) => ({ completed: 'badge-success', incomplete: 'badge-warning', ongoing: 'badge-info', absent: 'badge-danger' }[s] || 'badge-muted');
  const getValClass = (s) => ({ valid: 'badge-success', invalid: 'badge-danger', pending: 'badge-muted' }[s] || 'badge-muted');

  const completedCount = report.filter(r => r.shiftStatus === 'completed').length;
  const totalHours = report.reduce((sum, r) => sum + (r.totalHours || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Daily Attendance Report</h1>
          <p>
            {user.role === 'employee' ? 'Your personal' : user.role === 'manager' ? 'Your team\'s' : 'System-wide'} attendance report
          </p>
        </div>
        <button className="btn btn-outline" onClick={printReport}>🖨 Print Report</button>
      </div>

      <div className="filters-card">
        <div className="filter-group">
          <label>Report Date</label>
          <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="report-date-display">
          📅 {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Summary */}
      <div className="stats-row">
        <div className="stat-card stat-blue">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-number">{report.length}</div>
            <div className="stat-label">Total Records</div>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">{completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <div className="stat-number">{report.length - completedCount}</div>
            <div className="stat-label">Incomplete</div>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon">⏱</div>
          <div className="stat-info">
            <div className="stat-number">{totalHours.toFixed(1)}h</div>
            <div className="stat-label">Total Hours</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="table-loading"><span className="spinner-lg"></span></div>
      ) : report.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Data for This Date</h3>
          <p>No attendance records found for {date}.</p>
        </div>
      ) : (
        <div className="table-card printable">
          <div className="report-title">
            <h2>Attendance Report — {date}</h2>
            <p>Generated: {new Date().toLocaleString('en-IN')}</p>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                {user.role !== 'employee' && <th>Employee</th>}
                {user.role !== 'employee' && <th>Department</th>}
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Hours</th>
                <th>Selfie</th>
                <th>Location</th>
                <th>Shift</th>
                <th>Validation</th>
                <th>OT</th>
              </tr>
            </thead>
            <tbody>
              {report.map((rec) => (
                <tr key={rec.id}>
                  {user.role !== 'employee' && (
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{rec.employee?.name?.charAt(0)}</div>
                        <div>
                          <div className="user-name">{rec.employee?.name}</div>
                          <div className="user-email">{rec.employee?.email}</div>
                        </div>
                      </div>
                    </td>
                  )}
                  {user.role !== 'employee' && <td>{rec.employee?.department || '—'}</td>}
                  <td>{rec.date}</td>
                  <td>{formatTime(rec.punchIn)}</td>
                  <td>{formatTime(rec.punchOut)}</td>
                  <td className="hours-cell">{rec.totalHours?.toFixed(1) || '0'}h</td>
                  <td>
                    {rec.selfie ? (
                      <img
                        src={rec.selfie}
                        alt="Selfie"
                        className="table-selfie"
                        onClick={() => setShowSelfie(rec)}
                        title="Click to view"
                      />
                    ) : '—'}
                  </td>
                  <td>
                    {rec.location ? (
                      <a
                        href={`https://maps.google.com/?q=${rec.location.latitude},${rec.location.longitude}`}
                        target="_blank" rel="noreferrer" className="location-link"
                      >📍 View</a>
                    ) : '—'}
                  </td>
                  <td><span className={`badge ${getShiftClass(rec.shiftStatus)}`}>{rec.shiftStatus}</span></td>
                  <td><span className={`badge ${getValClass(rec.validationStatus)}`}>{rec.validationStatus}</span></td>
                  <td>
                    {rec.overtimeStatus ? (
                      <span className={`badge ${rec.overtimeStatus === 'approved' ? 'badge-success' : rec.overtimeStatus === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {rec.overtimeStatus}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showSelfie && (
        <div className="modal-overlay" onClick={() => setShowSelfie(null)}>
          <div className="selfie-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Selfie — {showSelfie.employee?.name} ({showSelfie.date})</h3>
              <button className="btn-icon" onClick={() => setShowSelfie(null)}>✕</button>
            </div>
            <img src={showSelfie.selfie} alt="Selfie full" className="selfie-full" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
