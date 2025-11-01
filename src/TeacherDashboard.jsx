import { useState, useEffect } from 'react';
import { API_NODE } from './App'; // Import the API URL

// NEW: A component to show the QR Code
// We will install a library for this
import { QRCodeSVG } from 'qrcode.react';

export default function TeacherDashboard({ user, onLogout }) {
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: State to manage the QR code modal
  const [showQr, setShowQr] = useState(null); // Will hold the classCode
  const [qrError, setQrError] = useState(null);

  useEffect(() => {
    setSchedule(user.timetable || []);
    setIsLoading(false);
  }, [user]);

  // NEW: This function calls our Node.js API
  const handleShowQr = async (classCode) => {
    setQrError(null);
    setShowQr(classCode); // Show the modal with a loading spinner

    try {
      // Step 1: Get the teacher's GPS location
      const coords = await getGPSCoordinates();
      
      // Step 2: Send it to the Node.js API to set the geofence
      const response = await fetch(`${API_NODE}/api/set-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, coords }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      
      // If success, the QR code is already visible.
      // If error, it will be caught below.
      
    } catch (err) {
      setQrError(err.message || 'Failed to get location.');
      // Don't close the modal, just show the error in it
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="w-full max-w-3xl">
        <header className="flex justify-between items-center w-full mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
            <p className="text-gray-400">Today's Schedule</p>
          </div>
          <button
            onClick={onLogout}
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Logout
          </button>
        </header>

        <main className="w-full space-y-4">
          {/* (Rest of the JSX is the same) */}
          {isLoading ? (
            <p className="text-center text-gray-400">Loading schedule...</p>
          ) : schedule.length > 0 ? (
            schedule.map((cls) => (
              <ScheduleCard 
                key={cls.id} 
                cls={cls} 
                onShowQr={handleShowQr} 
              />
            ))
          ) : (
            <p className="text-center text-gray-400">No classes scheduled for today.</p>
          )}
        </main>

        {/* --- NEW: QR CODE MODAL --- */}
        {showQr && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
              <h2 className="text-2xl font-bold mb-4">Scan to Mark Attendance</h2>
              <p className="text-lg mb-6 text-gray-300">{showQr}</p>
              
              {/* This is the QR Code itself */}
              <div className="bg-white p-4 rounded-lg inline-block">
                <QRCodeSVG value={showQr} size={256} />
              </div>

              {qrError ? (
                 <p className="text-red-400 mt-4">{qrError}</p>
              ) : (
                 <p classNameclassName="text-gray-400 mt-4">Setting location...</p>
              )}

              <button
                onClick={() => setShowQr(null)}
                className="mt-6 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleCard({ cls, onShowQr }) {
  // (This component is the same as before)
  const isLive = cls.live;
  return (
    <div 
      className={`
        p-4 rounded-lg shadow-md bg-gray-800 
        transition-all ${isLive ? 'border-2 border-cyan-500' : 'border-2 border-transparent'}
      `}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <div>
          <div className="flex items-center space-x-3 mb-1 sm:mb-0">
            <h2 className="text-xl font-bold">{cls.code} - {cls.name}</h2>
            {isLive && (
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-pulse">
                LIVE
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">{cls.time} | Students Present: {cls.student_count}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          {isLive && (
            <button
              onClick={() => onShowQr(cls.code)}
              className="w-full sm:w-auto px-5 py-2.5 font-medium bg-cyan-600 text-white rounded-lg transition-colors hover:bg-cyan-700"
            >
              Show QR Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// NEW: GPS Helper Function (copied from our planning)
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
        if (error.code === 1) { // Error code 1 = User denied permission
          reject(new Error('Please allow location access to start the session.'));
        } else {
          reject(new Error('Could not get your location.'));
        }
      },
      // Options for high accuracy
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}