/**
 * WebcamCapture - Composant réutilisable pour capture photo/vidéo
 * 
 * Props :
 * - onCapture(base64Image) : Callback quand photo capturée
 * - onVideoCapture(framesArray) : Callback pour vidéo (liveness)
 * - mode : 'photo' ou 'video'
 * - label : Texte du bouton
 */

import React, { useRef, useState, useEffect } from 'react';
import './WebcamCapture.css';

const WebcamCapture = ({ 
  onCapture, 
  onVideoCapture, 
  mode = 'photo', 
  label = 'Capturer',
  videoFrames = 5,
  videoDuration = 2000
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Démarrer la webcam
  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error('Erreur accès webcam:', err);
      setError('Impossible d\'accéder à la webcam. Vérifiez les permissions.');
    }
  };

  // Arrêter la webcam
  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Capturer photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageBase64 = canvas.toDataURL('image/png');
    setCapturedImage(imageBase64);
    
    if (onCapture) {
      onCapture(imageBase64);
    }
  };

  // Capturer vidéo (plusieurs frames pour liveness)
  const captureVideo = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsRecording(true);
    const frames = [];
    const intervalTime = videoDuration / videoFrames;

    // Countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setCountdown(null);

    // Capturer frames
    for (let i = 0; i < videoFrames; i++) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const frameBase64 = canvas.toDataURL('image/png');
      frames.push(frameBase64);
      
      await new Promise(resolve => setTimeout(resolve, intervalTime));
    }

    setIsRecording(false);
    
    if (onVideoCapture) {
      onVideoCapture(frames);
    }

    // Afficher dernière frame
    setCapturedImage(frames[frames.length - 1]);
  };

  // Recommencer
  const retake = () => {
    setCapturedImage(null);
    setIsCapturing(false);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  return (
    <div className="webcam-capture">
      <div className="webcam-container">
        {/* Vidéo live */}
        {!capturedImage && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="webcam-video"
              style={{ display: stream ? 'block' : 'none' }}
            />
            
            {!stream && !error && (
              <div className="webcam-placeholder">
                <p>📷 Webcam non démarrée</p>
                <button onClick={startWebcam} className="btn-start-webcam">
                  Démarrer la caméra
                </button>
              </div>
            )}
            
            {countdown && (
              <div className="countdown-overlay">
                <div className="countdown-number">{countdown}</div>
                <p>Regardez la caméra</p>
              </div>
            )}
            
            {isRecording && !countdown && (
              <div className="recording-indicator">
                <div className="recording-dot"></div>
                <span>Enregistrement en cours...</span>
              </div>
            )}
          </>
        )}

        {/* Image capturée */}
        {capturedImage && (
          <div className="captured-preview">
            <img src={capturedImage} alt="Captured" />
          </div>
        )}

        {/* Canvas caché */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Erreur */}
      {error && (
        <div className="webcam-error">
          ⚠️ {error}
        </div>
      )}

      {/* Contrôles */}
      <div className="webcam-controls">
        {stream && !capturedImage && !isRecording && (
          <>
            {mode === 'photo' && (
              <button 
                onClick={capturePhoto} 
                className="btn-capture"
                disabled={isCapturing}
              >
                📸 {label}
              </button>
            )}
            
            {mode === 'video' && (
              <button 
                onClick={captureVideo} 
                className="btn-capture btn-video"
                disabled={isRecording}
              >
                🎥 {label}
              </button>
            )}

            <button onClick={stopWebcam} className="btn-stop">
              ⏹️ Arrêter
            </button>
          </>
        )}

        {capturedImage && (
          <div className="capture-actions">
            <button onClick={retake} className="btn-retake">
              🔄 Reprendre
            </button>
            <button className="btn-confirm" disabled>
              ✅ Confirmer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;
