import { useState, useEffect, useRef } from 'react';
import { API_NODE, API_PYTHON } from './App'; // Import our API URLs

// --- CORRECTED HELPER COMPONENT ---
import { MdGpsFixed } from 'react-icons/md'; // This is the correct import

export function VerificationFlow({ classCode, userId, onCancel, onSuccess }) {
  const [step, setStep] = useState('qr'); // qr, location, face, success
  const [statusMessage, setStatusMessage] = useState('Scan the QR code in class...');
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // This hook runs the correct logic when the 'step' changes
  useEffect(() => {
    const runStep = async () => {
      setError(null); // Clear previous errors
      
      if (step === 'qr') {
        setStatusMessage('Scan the QR code in class...');
        // TODO: Add real QR scanning logic
        // For now, we'll fake it after 2 seconds
        await startCamera(false); // Start rear camera
        setTimeout(() => {
          // Fake a successful scan of the correct class code
          handleQrScan(classCode); 
        }, 2000);
      } 
      
      else if (step === 'location') {
        setStatusMessage('Verifying your location...');
        stopCamera(); // Stop camera while we check GPS
        try {
          const coords = await getGPSCoordinates();
          // Send to Node.js backend
          const response = await fetch(`${API_NODE}/api/verify-location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classCode, coords }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          
          // Location is good, move to face scan
          setStep('face');
        } catch (err) {
          setError(err.message || 'Location check failed.');
        }
      } 
      
      else if (step === 'face') {
        setStatusMessage('Position your face in the oval...');
        try {
          await startCamera(true); // Start FRONT camera
    
          // Wait 3 seconds for user to get ready
          setTimeout(async () => {
            setStatusMessage('Verifying face...');
            const imageBase64 = captureFrame();
            stopCamera(); // Stop camera
      
            // --- THIS IS NOW LIVE ---
            const response = await fetch(`${API_PYTHON}/api/verify-face`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: imageBase64, userId }),
            });
      
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
      
            // SUCCESS!
            setStep('success');
            onSuccess(result.message); // Call the success handler

          }, 3000);

        } catch (err) {
          setError(err.message || 'Face scan failed.');
        }
      }
    };
    
    runStep();
    
    // Cleanup: make sure camera is off when component is unmounted
    return () => {
      stopCamera();
    };
  }, [step]); // Re-run this logic whenever the 'step' state changes

  // --- Camera Helper Functions ---
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
    
    // Flip the image back to normal if it's the front camera
    if (step === 'face') {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9); // Get base64 Data URL
  };
  
  // --- QR Scan Handler ---
  const handleQrScan = (scannedCode) => {
    if (scannedCode === classCode) {
      setStep('location'); // QR code matches, move to next step
    } else {
      setError('Wrong QR Code. You scanned a code for a different class.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-lg text-center">
        
        <h1 className="text-2xl font-bold mb-4">Marking Attendance for {classCode}</h1>
        
        {/* Camera/Status View */}
        <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-lg">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover" 
            autoPlay 
            playsInline 
            muted
            style={{ transform: step === 'face' ? 'scaleX(-1)' : 'none' }} // Mirror front camera
          />
          
          {/* Overlays */}
          {step === 'qr' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-dashed border-cyan-400 rounded-lg" />
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
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              {/* --- CORRECTED ICON NAME --- */}
              <MdGpsFixed className="animate-ping h-20 w-20 text-cyan-400" />
            </div>
          )}
        </div>
        
        {/* Status Message */}
        <p className="text-xl font-medium mt-6 text-cyan-400 h-14">
          {statusMessage}
        </p>
        
        {/* Error Message */}
        {error && (
          <p className="text-red-400 mt-4">{error}</p>
        )}
        
        <button
          onClick={onCancel}
          className="mt-4 text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// GPS Helper Function (copied from TeacherDashboard)
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