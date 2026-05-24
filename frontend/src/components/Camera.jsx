import { useState, useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

const Camera = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState('');

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        setError('');
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permission.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataURL);
    stopCamera();
  }, [stopCamera]);

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirm = () => {
    onCapture(capturedImage);
    onClose();
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  return (
    <div className="camera-modal-overlay">
      <div className="camera-modal">
        <div className="camera-header">
          <h3>📷 Capture Selfie</h3>
          <button className="btn-icon" onClick={() => { stopCamera(); onClose(); }}>✕</button>
        </div>

        {error && <div className="camera-error">{error}</div>}

        <div className="camera-view">
          {!capturedImage ? (
            <video ref={videoRef} autoPlay muted playsInline className="camera-video" />
          ) : (
            <img src={capturedImage} alt="Captured selfie" className="camera-preview" />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div className="camera-actions">
          {!capturedImage ? (
            <button className="btn btn-primary" onClick={capture} disabled={!isStreaming}>
              📸 Take Photo
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={retake}>🔄 Retake</button>
              <button className="btn btn-success" onClick={confirm}>✅ Use This Photo</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

Camera.propTypes = {
  onCapture: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Camera;


//  jhj