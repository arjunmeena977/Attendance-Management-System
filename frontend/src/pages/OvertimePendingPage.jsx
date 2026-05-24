import React, { useState } from 'react';
import { useGetPendingOvertimeQuery, useReviewOvertimeMutation } from '../features/overtime/overtimeApi';
import toast from 'react-hot-toast';

const OvertimePendingPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useGetPendingOvertimeQuery({ page, limit: 20 });
  const records = data?.records || [];
  const total = data?.total || 0;

  const [reviewOvertime, { isLoading: reviewing }] = useReviewOvertimeMutation();
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: 'approved', remarks: '' });

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await reviewOvertime({ id: reviewModal._id, ...reviewForm }).unwrap();
      toast.success(`Overtime ${reviewForm.status}!`);
      setReviewModal(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Review failed.');
    }
  };

  const formatTime = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '--';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Overtime Requests</h1>
        <p>Review and approve or reject pending overtime requests</p>
        <div className="pending-count-badge">{total} Pending</div>
      </div>

      {isLoading ? (
        <div className="table-loading"><span className="spinner-lg"></span></div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>No Pending Requests</h3>
          <p>All overtime requests have been reviewed.</p>
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>OT Hours</th>
                <th>Reason</th>
                <th>Shift Status</th>
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
                  <td>{rec.date}</td>
                  <td className="hours-cell">{rec.overtimeRequest?.requestedHours}h</td>
                  <td className="reason-cell">{rec.overtimeRequest?.reason || '—'}</td>
                  <td><span className={`badge ${rec.shiftStatus === 'completed' ? 'badge-success' : 'badge-warning'}`}>{rec.shiftStatus}</span></td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="btn btn-xs btn-success"
                        onClick={() => { setReviewModal(rec); setReviewForm({ status: 'approved', remarks: '' }); }}
                      >✓ Approve</button>
                      <button
                        className="btn btn-xs btn-danger"
                        onClick={() => { setReviewModal(rec); setReviewForm({ status: 'rejected', remarks: '' }); }}
                      >✕ Reject</button>
                    </div>
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

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{reviewForm.status === 'approved' ? '✅ Approve' : '❌ Reject'} Overtime</h3>
              <button className="btn-icon" onClick={() => setReviewModal(null)}>✕</button>
            </div>
            <form onSubmit={handleReview} className="modal-body">
              <div className="review-summary">
                <div><strong>Employee:</strong> {reviewModal.userId?.name}</div>
                <div><strong>Date:</strong> {reviewModal.date}</div>
                <div><strong>Requested:</strong> {reviewModal.overtimeRequest?.requestedHours}h overtime</div>
                <div><strong>Reason:</strong> {reviewModal.overtimeRequest?.reason || 'Not provided'}</div>
              </div>
              <div className="form-group">
                <label>Decision</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input type="radio" name="status" value="approved" checked={reviewForm.status === 'approved'} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })} />
                    <span className="radio-label radio-valid">✅ Approve</span>
                  </label>
                  <label className="radio-option">
                    <input type="radio" name="status" value="rejected" checked={reviewForm.status === 'rejected'} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })} />
                    <span className="radio-label radio-invalid">❌ Reject</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <textarea className="form-input" rows="2" placeholder="Optional remarks..." value={reviewForm.remarks} onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
                <button type="submit" className={`btn ${reviewForm.status === 'approved' ? 'btn-success' : 'btn-danger'}`} disabled={reviewing}>
                  {reviewing ? <span className="spinner"></span> : `Confirm ${reviewForm.status === 'approved' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OvertimePendingPage;
