//additional comment
import { useState, useEffect, useRef } from 'react';
import { API_NODE, API_PYTHON } from './App';
import { MdGpsFixed, MdCameraAlt } from 'react-icons/md'; // Added Camera icon
import { Html5Qrcode } from 'html5-qrcode';

export function VerificationFlow({ classCode, userId, onCancel, onSuccess }) {
  const [step, setStep] = useState('qr');
  const [statusMessage, setStatusMessage] = useState('Starting QR scanner...');
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // New state for loading

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const qrScannerRef = useRef(null);

  // Main logic controller
  useEffect(() => {
    const runStep = async () => {
      setError(null);
      
      if (step === 'qr') {
        setStatusMessage('Scan the QR code in class...');
        
        // Clear any old scanners
        if (qrScannerRef.current) {
          try { qrScannerRef.current.clear(); } catch (e) {}
        }
        
        try {
           // Start rear camera for QR scanning
           await startCamera(false);

           // Initialize QR scanner on the video element
           const qrScanner = new Html5Qrcode("video-feed"); // Use the video element's ID
           qrScannerRef.current = qrScanner;

           // Start scanning
           // We rely on the video element already playing, so we might not need full start here
           // Actually, Html5Qrcode needs to take over the stream or element.
           // Let's use a simpler approach: let Html5Qrcode handle the camera for QR step
           // But since we already started the camera with startCamera, we can just pass the stream?
           // No, Html5Qrcode is easier if we let IT handle the camera. 
           // Let's refactor slightly: Stop our manual camera, let QR scanner start it.
           stopAllScanners(); 

            const qrScannerInstance = new Html5Qrcode("qr-reader-container");
            qrScannerRef.current = qrScannerInstance;
            
            await qrScannerInstance.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    handleQrScan(decodedText);
                },
                (errorMessage) => {
                    // ignore
                }
            );

        } catch (err) {
            console.error("QR Error", err);
            setError("Failed to start QR scanner. Please grant camera permission.");
        }
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
        setStatusMessage('Position your face in the oval.');
        try {
          await startCamera(true); // Start FRONT camera
          // We wait for user to click the capture button
        } catch (err) {
          setError(err.message || 'Face scan failed.');
        }
      }
    };
    
    runStep();
    
    return () => {
      stopAllScanners();
    };
  }, [step]);

  // --- Helper Functions ---

  const stopAllScanners = () => {
    if (qrScannerRef.current) {
      try {
        if (qrScannerRef.current.isScanning) {
            qrScannerRef.current.stop().catch(e => console.error(e));
        }
        qrScannerRef.current.clear().catch(e => console.error(e));
      } catch (err) {
        console.warn("Error stopping QR scanner:", err);
      }
      qrScannerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (useFrontCamera) => {
    return new Promise(async (resolve, reject) => {
        try {
            stopAllScanners();
            const constraints = { 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: useFrontCamera ? 'user' : 'environment' 
                } 
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    resolve();
                };
            } else {
                 // If video ref isn't ready yet (e.g. QR step using div), just resolve
                 // The QR library handles its own video element inside the div
                 resolve();
            }
        } catch (err) {
            console.error("Error accessing camera: ", err);
            setError("Could not access camera. Please grant permission.");
            reject(err);
        }
    });
  };

  const captureFrame = () => {
    if (!videoRef.current) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    
    // Flip if mirroring
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
    }
  };

  const handleCapture = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatusMessage('Verifying face...');
    
    try {
      const imageBase64 = captureFrame(); 
      stopAllScanners(); // Stop camera while processing

      if (!API_PYTHON) throw new Error("AI server URL is not configured.");

      // 1. AI Check
      const aiResponse = await fetch(`${API_PYTHON}/api/verify-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, userId }),
      });
      
      const aiResult = await aiResponse.json();
      
      if (!aiResponse.ok) {
        throw new Error(aiResult.message || "Face verification failed.");
      }

      // 2. Mark Attendance
      setStatusMessage('Marking attendance...');
      const backendResponse = await fetch(`${API_NODE}/api/mark-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, userId }),
      });
      
      const backendResult = await backendResponse.json();
      if (!backendResponse.ok) throw new Error(backendResult.message);

      setStep('success');
      onSuccess(backendResult.message);

    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
      // Restart camera so they can try again
      startCamera(true);
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
             
            {/* Container for QR Scanner Library (Auto-creates video) */}
            <div id="qr-reader-container" className={`w-full h-full ${step === 'qr' ? '' : 'hidden'}`} />
            
            {/* Video Element for Face Scan (We control this one) */}
            <video 
              id="video-feed"
              ref={videoRef} 
              className={`w-full h-full object-cover ${step === 'face' ? '' : 'hidden'}`} 
              autoPlay 
              playsInline 
              muted
              style={{ transform: step === 'face' ? 'scaleX(-1)' : 'none' }}
            />

             {/* Face Overlay */}
            {step === 'face' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[320px] h-[420px] border-4 border-white rounded-full" style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)' }} />
              </div>
            )}

             {/* Location Overlay */}
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
          
          {/* --- ERROR RETRY SECTION --- */}
          {step === 'face' && error && (
             <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                      setError(null); // Clear error to show the Verify button again
                      // The camera was already restarted by the catch block in handleCapture
                  }}
                  className="mt-2 w-full bg-yellow-500 hover:opacity-90 text-white font-bold py-4 px-4 rounded-xl text-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <MdCameraAlt className="text-2xl" />
                  Try Again
                </button>
             </div>
          )}

          {/* --- NORMAL CAPTURE BUTTON --- */}
          {step === 'face' && !isProcessing && !error && (
            <button
              onClick={handleCapture}
              className="mt-2 w-full bg-main-blue hover:opacity-90 text-white font-bold py-4 px-4 rounded-xl text-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <MdCameraAlt className="text-2xl" />
              Verify Identity
            </button>
          )}
          
          <button
            onClick={handleCancel}
            className="mt-4 text-gray-500 hover:text-gray-900 font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// GPS Helper
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