import { useState, useEffect, useRef } from 'react';
import { API_NODE, API_PYTHON } from './App';
import { MdGpsFixed } from 'react-icons/md';
import { Html5QrcodeScanner } from 'html5-qrcode'; // <-- Import the new library

export function VerificationFlow({ classCode, userId, onCancel, onSuccess }) {
  const [step, setStep] = useState('qr'); 
  const [statusMessage, setStatusMessage] = useState('Starting QR scanner...');
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  // --- NEW: A ref for the QR scanner ---
  const qrScannerRef = useRef(null);

  useEffect(() => {
    const runStep = async () => {
      setError(null); 
      
      // --- UPGRADED: REAL QR SCANNER ---
      if (step === 'qr') {
        setStatusMessage('Scan the QR code in class...');
        
        // Clear any old scanners
        if (qrScannerRef.current) {
          qrScannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
        }
        
        const qrScanner = new Html5QrcodeScanner(
          "qr-reader-container", // ID of the div we'll create
          { fps: 10, qrbox: { width: 250, height: 250 } },
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
          await startCamera(true); 
          
          setTimeout(async () => {
            setStatusMessage('Verifying face...');
            const imageBase64 = captureFrame();
            stopCamera();
            
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

          }, 3000);
        } catch (err) {
          setError(err.message || 'Face scan failed.');
        }
      }
    };
    
    runStep();
    
    // Cleanup: make sure all cameras/scanners are off
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
      stopCamera();
    };
  }, [step]); 

  // ... (Camera functions are the same) ...
  const startCamera = async (useFrontCamera) => { /* ... no change ... */ };
  const stopCamera = () => { /* ... no change ... */ };
  const captureFrame = () => { /* ... no change ... */ };
  
  const handleQrScan = (scannedCode) => {
    if (scannedCode === classCode) {
      setStep('location');
    } else {
      setError(`Wrong QR Code. You scanned ${scannedCode}, but this class is ${classCode}.`);
      // It will just keep scanning
    }
  };

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
            
            {/* --- THIS DIV IS FOR THE QR SCANNER --- */}
            <div id="qr-reader-container" className={step === 'qr' ? '' : 'hidden'} />
            
            {/* --- THIS IS FOR THE FACE SCAN --- */}
            <video 
              ref={videoRef} 
              className={`w-full h-full object-cover ${step === 'face' ? '' : 'hidden'}`} 
              autoPlay 
              playsInline 
              muted
              style={{ transform: 'scaleX(-1)' }}
            />
            
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

// ... (GPS function is the same) ...
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