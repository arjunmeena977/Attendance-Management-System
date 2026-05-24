import React, { useState, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { usePunchInMutation, usePunchOutMutation, useGetTodayAttendanceQuery } from '../features/attendance/attendanceApi';
import Camera from '../components/Camera';
import toast from 'react-hot-toast';

const PunchPage = () => {
  const user = useSelector(selectCurrentUser);
  const { data: todayData, isLoading: loadingToday, refetch } = useGetTodayAttendanceQuery();
  const [punchIn, { isLoading: punchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: punchingOut }] = usePunchOutMutation();

  const [showCamera, setShowCamera] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState(null);
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  const attendance = todayData?.attendance;
  const hasPunchedIn = attendance?.punchIn?.time;
  const hasPunchedOut = attendance?.punchOut?.time;

  const getLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocLoading(false);
        toast.success('Location captured!');
      },
      (err) => {
        setLocLoading(false);
        toast.error('Location access denied. Please allow location.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handlePunchIn = async () => {
    if (!capturedSelfie) return toast.error('Please capture a selfie first.');
    if (!location) return toast.error('Please capture your location first.');

    try {
      await punchIn({
        selfie: capturedSelfie,
        latitude: location.latitude,
        longitude: location.longitude,
      }).unwrap();
      toast.success('Punched In successfully! 🎉');
      setCapturedSelfie(null);
      setLocation(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Punch In failed.');
    }
  };

  const handlePunchOut = async () => {
    if (!location) return toast.error('Please capture your location first.');

    try {
      await punchOut({
        latitude: location.latitude,
        longitude: location.longitude,
      }).unwrap();
      toast.success('Punched Out successfully!');
      setLocation(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Punch Out failed.');
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loadingToday) return <div className="page-loading"><span className="spinner-lg"></span></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Punch In / Out</h1>
        <p>Mark your attendance for today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Today's Status Card */}
      <div className="punch-status-row">
        <div className="status-card">
          <div className="status-label">Punch In</div>
          <div className="status-time">{formatTime(attendance?.punchIn?.time)}</div>
          <div className={`status-badge ${hasPunchedIn ? 'badge-success' : 'badge-muted'}`}>
            {hasPunchedIn ? '✓ Done' : 'Pending'}
          </div>
        </div>

        <div className="status-divider">
          <div className="status-divider-line"></div>
          <div className={`shift-badge ${attendance?.shiftStatus}`}>
            {attendance?.shiftStatus || 'Not Started'}
          </div>
        </div>

        <div className="status-card">
          <div className="status-label">Punch Out</div>
          <div className="status-time">{formatTime(attendance?.punchOut?.time)}</div>
          <div className={`status-badge ${hasPunchedOut ? 'badge-success' : 'badge-muted'}`}>
            {hasPunchedOut ? '✓ Done' : 'Pending'}
          </div>
        </div>

        <div className="status-card">
          <div className="status-label">Total Hours</div>
          <div className="status-time hours-display">{attendance?.totalHours?.toFixed(1) || '0.0'}h</div>
          <div className={`status-badge ${attendance?.totalHours >= 8 ? 'badge-success' : 'badge-warning'}`}>
            {attendance?.totalHours >= 8 ? 'Complete' : attendance?.totalHours > 0 ? 'In Progress' : 'No Data'}
          </div>
        </div>
      </div>

      {!hasPunchedOut && (
        <div className="punch-actions-card">
          <h2>{hasPunchedIn ? 'Ready to Punch Out?' : 'Start Your Day!'}</h2>

          {/* Step 1: Selfie (only for punch-in) */}
          {!hasPunchedIn && (
            <div className="punch-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Capture Selfie</h3>
                <p>Take a live photo to verify your identity</p>
                {capturedSelfie ? (
                  <div className="selfie-preview-container">
                    <img src={capturedSelfie} alt="Selfie preview" className="selfie-preview" />
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowCamera(true)}>Retake</button>
                  </div>
                ) : (
                  <button className="btn btn-outline" onClick={() => setShowCamera(true)}>
                    📷 Open Camera
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          <div className="punch-step">
            <div className="step-number">{hasPunchedIn ? '1' : '2'}</div>
            <div className="step-content">
              <h3>Capture Location</h3>
              <p>Allow location access to record your coordinates</p>
              {location ? (
                <div className="location-info">
                  <span className="location-icon">📍</span>
                  <div>
                    <div className="location-coords">
                      {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="location-link"
                    >
                      View on Maps →
                    </a>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={getLocation}>Refresh</button>
                </div>
              ) : (
                <button className="btn btn-outline" onClick={getLocation} disabled={locLoading}>
                  {locLoading ? <span className="spinner"></span> : '📍 Get Location'}
                </button>
              )}
            </div>
          </div>

          {/* Punch Button */}
          <div className="punch-btn-container">
            {!hasPunchedIn ? (
              <button
                className="btn btn-punch-in"
                onClick={handlePunchIn}
                disabled={punchingIn || !capturedSelfie || !location}
              >
                {punchingIn ? <span className="spinner"></span> : '🟢 PUNCH IN'}
              </button>
            ) : (
              <button
                className="btn btn-punch-out"
                onClick={handlePunchOut}
                disabled={punchingOut || !location}
              >
                {punchingOut ? <span className="spinner"></span> : '🔴 PUNCH OUT'}
              </button>
            )}
          </div>
        </div>
      )}

      {hasPunchedOut && (
        <div className="day-complete-card">
          <div className="day-complete-icon">🎉</div>
          <h2>Day Complete!</h2>
          <p>You've completed your attendance for today.</p>
          <div className="day-complete-stats">
            <div className="stat">
              <span className="stat-label">In</span>
              <span className="stat-value">{formatTime(attendance?.punchIn?.time)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Out</span>
              <span className="stat-value">{formatTime(attendance?.punchOut?.time)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Hours</span>
              <span className="stat-value">{attendance?.totalHours?.toFixed(1)}h</span>
            </div>
            <div className="stat">
              <span className="stat-label">Status</span>
              <span className={`stat-value ${attendance?.totalHours >= 8 ? 'text-success' : 'text-warning'}`}>
                {attendance?.totalHours >= 8 ? 'Completed ✓' : 'Incomplete'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Selfie from today */}
      {attendance?.punchIn?.selfie && (
        <div className="todays-selfie-card">
          <h3>Today's Selfie</h3>
          <img src={attendance.punchIn.selfie} alt="Today's punch-in selfie" className="todays-selfie" />
          <div className={`validation-badge badge-${attendance.validationStatus}`}>
            {attendance.validationStatus === 'valid' ? '✅ Verified Valid' :
             attendance.validationStatus === 'invalid' ? '❌ Marked Invalid' :
             '⏳ Pending Validation'}
          </div>
        </div>
      )}

      {showCamera && (
        <Camera
          onCapture={(img) => setCapturedSelfie(img)}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default PunchPage;
