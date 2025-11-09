import { useState, useEffect, useRef } from 'react';
import { API_NODE, API_PYTHON } from './App';
import { MdGpsFixed } from 'react-icons/md';
// We import the UI-based scanner, which is more reliable
import { Html5QrcodeScanner } from 'html5-qrcode'; 

export function VerificationFlow({ classCode, userId, onCancel, onSuccess }) {
  const [step, setStep] = useState('qr'); 
  const [statusMessage, setStatusMessage] = useState('Starting QR scanner...');
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null); // For face scan
  const streamRef = useRef(null); // For face scan
  const qrScannerRef = useRef(null); // Ref for the QR scanner

  // Main logic controller
  useEffect(() => {
    const runStep = async () => {
      setError(null); 
      
      if (step === 'qr') {
        setStatusMessage('Scan the QR code in class...');
        
        // Clear any old scanners
        if (qrScannerRef.current) {
          try {
            qrScannerRef.current.clear();
          } catch (err) {
            console.error("Failed to clear scanner", err);
          }
        }
        
        const qrScanner = new Html5QrcodeScanner(
          "qr-reader-container", // The ID of the div we are rendering into
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            // --- THIS IS THE FIX ---
            // This tells the scanner we ONLY want the camera
            supportedScanTypes: [0] // 0 = "SCAN_TYPE_CAMERA"
          },
          false // verbose = false
        );
        
        const onScanSuccess = (decodedText) => {
          qrScanner.clear(); // Stop scanning
          handleQrScan(decodedText);
        };
        
        const onScanFailure = (errorMessage) => {
          // just ignore, it scans constantly
        };
        
        qrScanner.render(onScanSuccess, onScanFailure);
        qrScannerRef.current = qrScanner;
      } 
      
      else if (step === 'location') {
        setStatusMessage('Verifying your location...');
        stopAllScanners();
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
            stopAllScanners();
            
            if (!API_PYTHON) throw new Error("AI server URL is not configured.");
            
            // --- 1. Call AI Server ---
            const aiResponse = await fetch(`${API_PYTHON}/api/verify-face`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: imageBase64, userId }),
            });
            const aiResult = await aiResponse.json();
            if (!aiResponse.ok) throw new Error(aiResult.message);
            
            // --- 2. Call Backend to Mark Attendance ---
            setStatusMessage('Marking attendance...');
            const backendResponse = await fetch(`${API_NODE}/api/mark-attendance`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ classCode, userId }),
            });
            const backendResult = await backendResponse.json();
            if (!backendResponse.ok) throw new Error(backendResult.message);

            // --- 3. Success ---
            setStep('success');
            onSuccess(backendResult.message);

          }, 3000); // 3-second delay
        } catch (err) {
          setError(err.message || 'Face scan failed.');
        }
      }
    };
    
    runStep();
    
    // Cleanup function
    return () => {
      stopAllScanners();
    };
  }, [step]); 

  // --- Utility Functions ---

  const stopAllScanners = () => {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.clear();
      } catch (err) {
        // This can fail if the component unmounts quickly, ignore
      }
      qrScannerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (useFrontCamera) => {
    try {
      stopAllScanners();
      const constraints = { video: { width: 480, height: 640, facingMode: useFrontCamera ? 'user' : 'environment' } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setError("Could not access camera. Please grant permission.");
      throw new Error("Could not access camera.");
    }
  };
  
  const captureFrame = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (videoRef.current.style.transform === 'scaleX(-1)') {
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
      setError(`Wrong QR Code. You scanned ${scannedCode}, but this class is ${classCode}.`);
      // It will just keep scanning, the error will show
    }
  };

  const handleCancel = () => {
    stopAllScanners();
    onCancel();
  }

  // --- RENDER ---
  return (
    <div className="relative w-full min-h-screen bg-white text-gray-900 overflow-hidden font-sans">
      <div className="absolute top-[-25rem] left-1/2 -translate-x-1/2 w-[100rem] h-[100rem] z-0 opacity-80 pointer-events-none">
        <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, #EBF4FF 0%, transparent 70%)', filter: 'blur(150px)' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg text-center">
          
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Marking Attendance for {classCode}
          </h1>
          
          <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
            
            {/* --- THIS IS THE DIV FOR THE QR SCANNER --- */}
            {/* It will be visible only on the 'qr' step */}
            <div id="qr-reader-container" className={step === 'qr' ? '' : 'hidden'} />
            
            {/* --- THIS IS FOR THE FACE SCAN --- */}
            <video 
              id="video-feed"
              ref={videoRef} 
              className={`w-full h-full object-cover ${step === 'face' ? '' : 'hidden'}`} 
              autoPlay 
              playsInline 
              muted
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Overlays */}
            {step === 'face' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                  className="w-[320px] h-[420px] border-4 border-white rounded-full"
                  style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)' }} 
                />
              </div>
            )}
            
            {step === 'location' && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                <MdGpsFixed className="animate-ping h-20 w-20 text-main-blue" />
              </div>
            )}
          </div>
          
          <p className="text-2xl font-semibold mt-8 text-main-blue h-14">
            {statusMessage}
          </p>
          
          {error && (
            <p className="font-poppins text-red-500 mt-4 text-lg">{error}</p>
          )}
          
          <button
            onClick={handleCancel}
            className="mt-6 text-gray-500 hover:text-gray-900 font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// GPS Helper Function
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