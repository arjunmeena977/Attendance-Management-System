import React, { useState } from 'react';
import { useGetMyAttendanceQuery } from '../features/attendance/attendanceApi';
import { useRequestOvertimeMutation, useGetMyOvertimeQuery } from '../features/overtime/overtimeApi';
import toast from 'react-hot-toast';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '--';
const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--';

const MyAttendancePage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetMyAttendanceQuery({ startDate, endDate, page, limit: 15 });
  const records = data?.records || [];
  const total = data?.total || 0;

  const [showOTModal, setShowOTModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [otForm, setOtForm] = useState({ requestedHours: '', reason: '' });
  const [requestOvertime, { isLoading: otLoading }] = useRequestOvertimeMutation();

  const handleOTRequest = async (e) => {
    e.preventDefault();
    try {
      await requestOvertime(otForm).unwrap();
      toast.success('Overtime request submitted!');
      setShowOTModal(false);
      setOtForm({ requestedHours: '', reason: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'OT request failed.');
    }
  };

  const getShiftBadge = (status) => {
    const map = { completed: 'badge-success', incomplete: 'badge-warning', ongoing: 'badge-info', absent: 'badge-danger' };
    return map[status] || 'badge-muted';
  };

  const getValidationBadge = (status) => {
    const map = { valid: 'badge-success', invalid: 'badge-danger', pending: 'badge-muted' };
    return map[status] || 'badge-muted';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Attendance</h1>
        <p>View your personal attendance history and working hours</p>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filter-group">
          <label>From Date</label>
          <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>To Date</label>
          <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}>
          Clear
        </button>
      </div>

      {/* Summary Stats */}
      <div className="stats-row">
        <div className="stat-card stat-blue">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-number">{total}</div>
            <div className="stat-label">Total Records</div>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">{records.filter((r) => r.shiftStatus === 'completed').length}</div>
            <div className="stat-label">Completed Days</div>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <div className="stat-number">{records.filter((r) => r.shiftStatus === 'incomplete').length}</div>
            <div className="stat-label">Incomplete Days</div>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon">⏱</div>
          <div className="stat-info">
            <div className="stat-number">{records.reduce((acc, r) => acc + (r.totalHours || 0), 0).toFixed(1)}h</div>
            <div className="stat-label">Total Hours</div>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="table-loading"><span className="spinner-lg"></span></div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Records Found</h3>
          <p>No attendance records for the selected period.</p>
        </div>
      ) : (
        <>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours</th>
                  <th>Shift</th>
                  <th>Validation</th>
                  <th>OT Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec._id}>
                    <td className="date-cell">{rec.date}</td>
                    <td>{formatTime(rec.punchIn?.time)}</td>
                    <td>{formatTime(rec.punchOut?.time)}</td>
                    <td className="hours-cell">{rec.totalHours?.toFixed(1) || '0.0'}h</td>
                    <td><span className={`badge ${getShiftBadge(rec.shiftStatus)}`}>{rec.shiftStatus || 'absent'}</span></td>
                    <td><span className={`badge ${getValidationBadge(rec.validationStatus)}`}>{rec.validationStatus}</span></td>
                    <td>
                      {rec.overtimeRequest?.requested ? (
                        <span className={`badge badge-${rec.overtimeRequest.status === 'approved' ? 'success' : rec.overtimeRequest.status === 'rejected' ? 'danger' : 'warning'}`}>
                          OT: {rec.overtimeRequest.status}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {rec.shiftStatus === 'completed' && !rec.overtimeRequest?.requested && (
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => { setSelectedRecord(rec); setShowOTModal(true); }}
                        >
                          Request OT
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="page-info">Page {page} of {Math.ceil(total / 15)}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </>
      )}

      {/* OT Request Modal */}
      {showOTModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Request Overtime</h3>
              <button className="btn-icon" onClick={() => setShowOTModal(false)}>✕</button>
            </div>
            <form onSubmit={handleOTRequest} className="modal-body">
              <div className="form-group">
                <label>Overtime Hours</label>
                <input
                  type="number" step="0.5" min="0.5" max="12"
                  className="form-input"
                  placeholder="e.g. 2"
                  value={otForm.requestedHours}
                  onChange={(e) => setOtForm({ ...otForm, requestedHours: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Reason for overtime..."
                  value={otForm.reason}
                  onChange={(e) => setOtForm({ ...otForm, reason: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOTModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={otLoading}>
                  {otLoading ? <span className="spinner"></span> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAttendancePage;
