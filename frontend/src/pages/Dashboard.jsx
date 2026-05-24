import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useGetTodayAttendanceQuery } from '../features/attendance/attendanceApi';
import { useGetMyAttendanceQuery } from '../features/attendance/attendanceApi';
import { useGetPendingOvertimeQuery } from '../features/overtime/overtimeApi';

/* ── Live Clock ─────────────────────────────────────────── */
const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="welcome-clock">
      <div className="clock-time">
        {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </div>
      <div className="clock-date">
        {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  );
};

/* ── Quick Actions per role ─────────────────────────────── */
const QUICK_ACTIONS = {
  employee: [
    { to: '/punch',         icon: '⏱',  title: 'Punch In / Out',  desc: 'Mark today\'s attendance' },
    { to: '/my-attendance', icon: '📋', title: 'My Attendance',    desc: 'View your history' },
    { to: '/reports',       icon: '📊', title: 'My Report',        desc: 'Daily summary' },
  ],
  manager: [
    { to: '/team-attendance', icon: '👥', title: 'Team Attendance', desc: 'View & validate team' },
    { to: '/overtime',        icon: '⏰', title: 'Overtime Queue',   desc: 'Pending approvals' },
    { to: '/reports',         icon: '📊', title: 'Team Report',      desc: 'Daily summary' },
  ],
  admin: [
    { to: '/users',           icon: '🛡', title: 'User Management', desc: 'Manage all users' },
    { to: '/team-attendance', icon: '👥', title: 'All Attendance',  desc: 'View all records' },
    { to: '/overtime',        icon: '⏰', title: 'Overtime Queue',  desc: 'Pending approvals' },
    { to: '/reports',         icon: '📊', title: 'Reports',         desc: 'Daily summary' },
  ],
};

/* ── Dashboard ──────────────────────────────────────────── */
const Dashboard = () => {
  const user = useSelector(selectCurrentUser);
  const isEmployee = user?.role === 'employee';
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';

  const { data: todayData } = useGetTodayAttendanceQuery(undefined, { skip: !isEmployee });
  const { data: myData } = useGetMyAttendanceQuery({ limit: 30 }, { skip: !isEmployee });
  const { data: pendingOT } = useGetPendingOvertimeQuery({ limit: 1 }, { skip: !isManagerOrAdmin });

  const attendance = todayData?.attendance;
  const records = myData?.records || [];

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--';

  const completedThisMonth = records.filter(r => r.shiftStatus === 'completed').length;
  const totalHoursThisMonth = records.reduce((acc, r) => acc + (r.totalHours || 0), 0);
  const pendingCount = pendingOT?.total || 0;

  const quickActions = QUICK_ACTIONS[user?.role] || QUICK_ACTIONS.employee;

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>{greet()}, {user?.name?.split(' ')[0]}! 👋</h2>
          <p>
            {user?.role === 'employee'
              ? attendance?.punchIn?.time
                ? `You punched in at ${formatTime(attendance.punchIn.time)}. ${attendance?.punchOut?.time ? 'Day complete ✓' : 'Have a great day!'}`
                : "You haven't punched in yet today."
              : `Managing ${user?.role === 'admin' ? 'the entire organization' : 'your team'} — ${pendingCount > 0 ? `${pendingCount} overtime request${pendingCount > 1 ? 's' : ''} need your attention.` : 'All caught up!'}`
            }
          </p>
        </div>
        <LiveClock />
      </div>

      {/* Stats Row */}
      {isEmployee ? (
        <div className="stats-row">
          <div className="stat-card stat-blue">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <div className="stat-number">{myData?.total || 0}</div>
              <div className="stat-label">Total Records</div>
            </div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <div className="stat-number">{completedThisMonth}</div>
              <div className="stat-label">Days Completed</div>
            </div>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-icon">⏱</div>
            <div className="stat-info">
              <div className="stat-number">{totalHoursThisMonth.toFixed(0)}h</div>
              <div className="stat-label">Hours Logged</div>
            </div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-icon">📍</div>
            <div className="stat-info">
              <div className="stat-number">
                {attendance?.shiftStatus === 'ongoing' ? '🟢 Live' :
                 attendance?.punchOut?.time ? '✓ Done' : '—'}
              </div>
              <div className="stat-label">Today's Status</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="stats-row">
          <div className="stat-card stat-purple">
            <div className="stat-icon">🏢</div>
            <div className="stat-info">
              <div className="stat-number">{user?.department || '—'}</div>
              <div className="stat-label">Department</div>
            </div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <div className="stat-number">{pendingCount}</div>
              <div className="stat-label">Pending OT Requests</div>
            </div>
          </div>
          <div className="stat-card stat-blue">
            <div className="stat-icon">🛡</div>
            <div className="stat-info">
              <div className="stat-number" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
              <div className="stat-label">Your Role</div>
            </div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-number">Live</div>
              <div className="stat-label">System Status</div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Punch Status (employees) */}
      {isEmployee && (
        <div className="dashboard-card">
          <h3>📍 Today's Attendance</h3>
          <div className="punch-status-row">
            <div className="status-card">
              <div className="status-label">Punch In</div>
              <div className="status-time">{formatTime(attendance?.punchIn?.time)}</div>
              <div className={`status-badge badge ${attendance?.punchIn?.time ? 'badge-success' : 'badge-muted'}`}>
                {attendance?.punchIn?.time ? '✓ Done' : 'Pending'}
              </div>
            </div>
            <div className="status-divider">
              <div className="status-divider-line" />
              <div className={`shift-badge ${attendance?.shiftStatus || ''}`}>
                {attendance?.shiftStatus || 'Not Started'}
              </div>
            </div>
            <div className="status-card">
              <div className="status-label">Punch Out</div>
              <div className="status-time">{formatTime(attendance?.punchOut?.time)}</div>
              <div className={`status-badge badge ${attendance?.punchOut?.time ? 'badge-success' : 'badge-muted'}`}>
                {attendance?.punchOut?.time ? '✓ Done' : 'Pending'}
              </div>
            </div>
            <div className="status-card">
              <div className="status-label">Hours Today</div>
              <div className="status-time hours-display">{attendance?.totalHours?.toFixed(1) || '0.0'}h</div>
              <div className={`status-badge badge ${attendance?.totalHours >= 8 ? 'badge-success' : attendance?.totalHours > 0 ? 'badge-warning' : 'badge-muted'}`}>
                {attendance?.totalHours >= 8 ? 'Complete' : attendance?.totalHours > 0 ? 'In Progress' : 'No Data'}
              </div>
            </div>
          </div>
          {!attendance?.punchIn?.time && (
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <Link to="/punch" className="btn btn-primary">
                ⏱ Go to Punch In
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="dashboard-card">
        <h3>⚡ Quick Actions</h3>
        <div className="quick-actions">
          {quickActions.map((qa) => (
            <Link key={qa.to} to={qa.to} className="quick-action-card">
              <div className="qa-icon">{qa.icon}</div>
              <div className="qa-title">{qa.title}</div>
              <div className="qa-desc">{qa.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Records (employees) */}
      {isEmployee && records.length > 0 && (
        <div className="dashboard-card">
          <h3>📋 Recent Attendance</h3>
          <div className="table-card" style={{ borderRadius: 8 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 7).map((rec) => (
                  <tr key={rec._id}>
                    <td className="date-cell">{rec.date}</td>
                    <td>{formatTime(rec.punchIn?.time)}</td>
                    <td>{formatTime(rec.punchOut?.time)}</td>
                    <td className="hours-cell">{rec.totalHours?.toFixed(1) || '0.0'}h</td>
                    <td>
                      <span className={`badge ${
                        rec.shiftStatus === 'completed' ? 'badge-success' :
                        rec.shiftStatus === 'incomplete' ? 'badge-warning' :
                        rec.shiftStatus === 'ongoing' ? 'badge-info' : 'badge-danger'
                      }`}>
                        {rec.shiftStatus || 'absent'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        rec.validationStatus === 'valid' ? 'badge-success' :
                        rec.validationStatus === 'invalid' ? 'badge-danger' : 'badge-muted'
                      }`}>
                        {rec.validationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <Link to="/my-attendance" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
        </div>
      )}

      {/* Manager/Admin tip */}
      {isManagerOrAdmin && pendingCount > 0 && (
        <div className="dashboard-card" style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.06))',
          border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <h3>⚠️ Action Required</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
            You have <strong style={{ color: 'var(--warning)' }}>{pendingCount} pending overtime request{pendingCount > 1 ? 's' : ''}</strong> waiting for your review.
          </p>
          <Link to="/overtime" className="btn btn-primary">Review Overtime Requests →</Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
