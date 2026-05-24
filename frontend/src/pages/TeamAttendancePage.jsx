import React, { useState } from 'react';
import { useGetTeamAttendanceQuery } from '../features/attendance/attendanceApi';
import { useValidateAttendanceMutation } from '../features/attendance/attendanceApi';
import toast from 'react-hot-toast';

const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--';

const TeamAttendancePage = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const [selfieModal, setSelfieModal] = useState(null);
  const [validateModal, setValidateModal] = useState(null);
  const [validationForm, setValidationForm] = useState({ validationStatus: 'valid', validationRemarks: '' });

  const { data, isLoading, refetch } = useGetTeamAttendanceQuery({ date, page, limit: 20 });
  const records = data?.records || [];
  const total = data?.total || 0;

  const [validateAttendance, { isLoading: validating }] = useValidateAttendanceMutation();

  const handleValidate = async (e) => {
    e.preventDefault();
    try {
      await validateAttendance({ id: validateModal._id, ...validationForm }).unwrap();
      toast.success(`Attendance marked as ${validationForm.validationStatus}!`);
      setValidateModal(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Validation failed.');
    }
  };

  const getShiftBadgeClass = (s) => ({ completed: 'badge-success', incomplete: 'badge-warning', ongoing: 'badge-info', absent: 'badge-danger' }[s] || 'badge-muted');
  const getValBadgeClass = (s) => ({ valid: 'badge-success', invalid: 'badge-danger', pending: 'badge-muted' }[s] || 'badge-muted');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Team Attendance</h1>
        <p>Monitor your team's attendance and verify records</p>
      </div>

      <div className="filters-card">
        <div className="filter-group">
          <label>Date</label>
          <input type="date" className="form-input" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
        </div>
        <div className="filter-summary">
          {total} records on {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-row">
        <div className="stat-card stat-green">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">{records.filter((r) => r.shiftStatus === 'completed').length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <div className="stat-number">{records.filter((r) => r.shiftStatus === 'incomplete').length}</div>
            <div className="stat-label">Incomplete</div>
          </div>
        </div>
        <div className="stat-card stat-blue">
          <div className="stat-icon">🔄</div>
          <div className="stat-info">
            <div className="stat-number">{records.filter((r) => r.shiftStatus === 'ongoing').length}</div>
            <div className="stat-label">Ongoing</div>
          </div>
        </div>
        <div className="stat-card stat-red">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <div className="stat-number">{records.filter((r) => r.validationStatus === 'pending').length}</div>
            <div className="stat-label">Pending Review</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="table-loading"><span className="spinner-lg"></span></div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No Team Records</h3>
          <p>No attendance records for your team on this date.</p>
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Hours</th>
                <th>Shift</th>
                <th>Selfie</th>
                <th>Validation</th>
                <th>OT</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => (
                <tr key={rec._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{rec.userId?.name?.charAt(0)}</div>
                      <div>
                        <div className="user-name">{rec.userId?.name}</div>
                        <div className="user-email">{rec.userId?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{rec.userId?.department || '—'}</td>
                  <td>{formatTime(rec.punchIn?.time)}</td>
                  <td>{formatTime(rec.punchOut?.time)}</td>
                  <td className="hours-cell">{rec.totalHours?.toFixed(1) || '0'}h</td>
                  <td><span className={`badge ${getShiftBadgeClass(rec.shiftStatus)}`}>{rec.shiftStatus}</span></td>
                  <td>
                    {rec.punchIn?.selfie ? (
                      <img
                        src={rec.punchIn.selfie}
                        alt="Selfie"
                        className="table-selfie"
                        onClick={() => setSelfieModal(rec)}
                        title="Click to view full"
                      />
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td><span className={`badge ${getValBadgeClass(rec.validationStatus)}`}>{rec.validationStatus}</span></td>
                  <td>
                    {rec.overtimeRequest?.requested ? (
                      <span className={`badge badge-${rec.overtimeRequest.status === 'approved' ? 'success' : rec.overtimeRequest.status === 'rejected' ? 'danger' : 'warning'}`}>
                        {rec.overtimeRequest.status}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {rec.punchIn?.time && (
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => { setValidateModal(rec); setValidationForm({ validationStatus: rec.validationStatus === 'valid' ? 'valid' : 'valid', validationRemarks: rec.validationRemarks || '' }); }}
                      >
                        ✓ Validate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="page-info">Page {page} of {Math.ceil(total / 20)}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

      {/* Selfie Full View Modal */}
      {selfieModal && (
        <div className="modal-overlay" onClick={() => setSelfieModal(null)}>
          <div className="selfie-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Selfie — {selfieModal.userId?.name} ({selfieModal.date})</h3>
              <button className="btn-icon" onClick={() => setSelfieModal(null)}>✕</button>
            </div>
            <img src={selfieModal.punchIn?.selfie} alt="Full selfie" className="selfie-full" />
            <div className="selfie-meta">
              <span>📍 {selfieModal.punchIn?.location?.latitude?.toFixed(5)}, {selfieModal.punchIn?.location?.longitude?.toFixed(5)}</span>
              <a
                href={`https://maps.google.com/?q=${selfieModal.punchIn?.location?.latitude},${selfieModal.punchIn?.location?.longitude}`}
                target="_blank" rel="noreferrer" className="location-link"
              >View on Maps</a>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {validateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Validate Attendance — {validateModal.userId?.name}</h3>
              <button className="btn-icon" onClick={() => setValidateModal(null)}>✕</button>
            </div>
            <form onSubmit={handleValidate} className="modal-body">
              {validateModal.punchIn?.selfie && (
                <img src={validateModal.punchIn.selfie} alt="Selfie" className="validate-selfie" />
              )}
              <div className="validate-info">
                <span>🕐 In: {formatTime(validateModal.punchIn?.time)}</span>
                <span>🕐 Out: {formatTime(validateModal.punchOut?.time)}</span>
                <span>⏱ {validateModal.totalHours?.toFixed(1)}h</span>
                {validateModal.punchIn?.location && (
                  <a href={`https://maps.google.com/?q=${validateModal.punchIn.location.latitude},${validateModal.punchIn.location.longitude}`}
                    target="_blank" rel="noreferrer" className="location-link">📍 View Location</a>
                )}
              </div>
              <div className="form-group">
                <label>Mark As</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input type="radio" name="vs" value="valid" checked={validationForm.validationStatus === 'valid'} onChange={(e) => setValidationForm({ ...validationForm, validationStatus: e.target.value })} />
                    <span className="radio-label radio-valid">✅ Valid</span>
                  </label>
                  <label className="radio-option">
                    <input type="radio" name="vs" value="invalid" checked={validationForm.validationStatus === 'invalid'} onChange={(e) => setValidationForm({ ...validationForm, validationStatus: e.target.value })} />
                    <span className="radio-label radio-invalid">❌ Invalid / Suspicious</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label>Remarks (optional)</label>
                <textarea className="form-input" rows="2" placeholder="Add notes..." value={validationForm.validationRemarks} onChange={(e) => setValidationForm({ ...validationForm, validationRemarks: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setValidateModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={validating}>
                  {validating ? <span className="spinner"></span> : 'Submit Validation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamAttendancePage;
