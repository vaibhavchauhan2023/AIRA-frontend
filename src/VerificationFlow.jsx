import { useState, useEffect, useRef } from 'react';
import { API_NODE, API_PYTHON } from './App';
import { MdGpsFixed } from 'react-icons/md';

export function VerificationFlow({ classCode, userId, onCancel, onSuccess }) {
  const [step, setStep] = useState('qr'); // qr, location, face, success
  const [statusMessage, setStatusMessage] = useState('Scan the QR code in class...');
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const runStep = async () => {
      setError(null); 
      
      if (step === 'qr') {
        setStatusMessage('Scan the QR code in class...');
        await startCamera(false); // Start rear camera
        setTimeout(() => {
          handleQrScan(classCode); 
        }, 2000);
      } 
      
      else if (step === 'location') {
        setStatusMessage('Verifying your location...');
        stopCamera(); 
        try {
          const coords = await getGPSCoordinates();
          const response = await fetch(`${API_NODE}/api/verify-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classCode, coords }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          
          setStep('face');
        } catch (err) {
          setError(err.message || 'Location check failed.');
        }
      } 
      
      else if (step === 'face') {
        setStatusMessage('Position your face in the oval...');
        try {
          await startCamera(true); // Start FRONT camera
          
          setTimeout(async () => {
            setStatusMessage('Verifying face...');
            const imageBase64 = captureFrame();
            stopCamera();
            
            if (!API_PYTHON) {
              throw new Error("AI server URL is not configured.");
            }

            const response = await fetch(`${API_PYTHON}/api/verify-face`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: imageBase64, userId }),
            });
            
            const result = await response.json();
            if (!response.ok) {
              throw new Error(result.message || 'Face verification failed.');
            }
            
            setStep('success');
            onSuccess(result.message);

          }, 3000);

        } catch (err) {
          setError(err.message || 'Face scan failed.');
        }
      }
    };
    
    runStep();
    
    return () => {
      stopCamera();
    };
  }, [step]);

  // --- Camera Helper Functions (No changes) ---
  const startCamera = async (useFrontCamera) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: { 
          width: 480, 
          height: 640, 
          facingMode: useFrontCamera ? 'user' : 'environment' 
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setError("Could not access camera. Please grant permission.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const captureFrame = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (step === 'face') {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  };
  
  const handleQrScan = (scannedCode) => {
    if (scannedCode === classCode) {
      setStep('location');
    } else {
      setError('Wrong QR Code. You scanned a code for a different class.');
    }
  };

  // --- NEW RENDER/STYLES ---
  return (
    <div className="relative w-full min-h-screen bg-white text-gray-900 overflow-hidden font-sans">
      {/* Background Aura */}
      <div className="absolute top-[-25rem] left-1/2 -translate-x-1/2 w-[100rem] h-[100rem] z-0 opacity-80 pointer-events-none">
        <div 
          className="w-full h-full rounded-full" 
          style={{
            background: 'radial-gradient(circle, #EBF4FF 0%, transparent 70%)',
            filter: 'blur(150px)',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg text-center">
          
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Marking Attendance for {classCode}
          </h1>
          
          {/* Camera/Status View */}
          <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              autoPlay 
              playsInline 
              muted
              style={{ transform: step === 'face' ? 'scaleX(-1)' : 'none' }}
            />
            
            {/* Overlays */}
            {step === 'qr' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-dashed border-main-blue rounded-lg" />
              </div>
            )}
            {step === 'face' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="w-[320px] h-[420px] border-4 border-white rounded-full"
                  style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)' }} 
                />
              </div>
            )}
            
            {/* Loading/Waiting Overlay */}
            {(step === 'location' || (step === 'face' && !streamRef.current)) && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <MdGpsFixed className="animate-ping h-20 w-20 text-main-blue" />
              </div>
            )}
          </div>
          
          {/* Status Message */}
          <p className="text-2xl font-semibold mt-8 text-main-blue h-14">
            {statusMessage}
          </p>
          
          {/* Error Message */}
          {error && (
            <p className="text-red-500 font-poppins mt-4 text-lg">{error}</p>
          )}
          
          <button
            onClick={onCancel}
            className="mt-6 text-gray-500 hover:text-gray-900 font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// GPS Helper Function (No changes)
function getGPSCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        if (error.code === 1) {
          reject(new Error('Please allow location access to mark attendance.'));
        } else {
          reject(new Error('Could not get your location.'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}