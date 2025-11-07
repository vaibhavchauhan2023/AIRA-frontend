import { useState, useEffect } from 'react';
import { API_NODE } from './App';
import { QRCodeSVG } from 'qrcode.react';

// --- UPGRADE: No longer needs 'onLogout' ---
export default function TeacherDashboard({ user }) {
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showQr, setShowQr] = useState(null); 
  const [qrError, setQrError] = useState(null);
  const [isSettingLocation, setIsSettingLocation] = useState(false);

  useEffect(() => {
    setSchedule(user.timetable || []);
    setIsLoading(false);
  }, [user]);

  const handleShowQr = async (classCode) => {
    setQrError(null);
    setShowQr(classCode);
    setIsSettingLocation(true); // Show loading spinner

    try {
      const coords = await getGPSCoordinates();
      
      const response = await fetch(`${API_NODE}/api/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, coords }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      
      // Success! Location is set.
      setIsSettingLocation(false);
      
    } catch (err) {
      setIsSettingLocation(false);
      setQrError(err.message || 'Failed to get location.');
    }
  };

  return (
    // --- UPGRADED: Removed the old dark container ---
    <div className="w-full max-w-5xl mx-auto">
      
      {/* --- UPGRADED: New Header Style --- */}
      <header className="flex justify-between items-center w-full mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Welcome, {user.name}!</h1>
          <p className="font-poppins text-xl text-gray-600">Today's Schedule</p>
        </div>
      </header>

      {/* Schedule Section */}
      <main className="w-full space-y-4">
        {isLoading ? (
          <p className="text-center font-poppins text-gray-500">Loading schedule...</p>
        ) : schedule.length > 0 ? (
          schedule.map((cls) => (
            <ScheduleCard 
              key={cls.id} 
              cls={cls} 
              onShowQr={handleShowQr} 
            />
          ))
        ) : (
          <p className="text-center font-poppins text-gray-500 py-20">No classes scheduled for today.</p>
        )}
      </main>

      {/* --- UPGRADED: Re-skinned QR Code Modal --- */}
      {showQr && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-10 rounded-3xl shadow-2xl text-center w-full max-w-md">
            <h2 className="text-3xl font-bold mb-2 text-main-blue">Scan to Mark Attendance</h2>
            <p className="font-poppins text-lg mb-6 text-gray-600">{showQr}</p>
            
            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 inline-block">
              <QRCodeSVG value={showQr} size={256} />
            </div>

            {isSettingLocation && (
               <p className="font-poppins text-gray-500 mt-6">Getting GPS location...</p>
            )}
            
            {qrError && (
               <p className="font-poppins text-red-500 mt-6">{qrError}</p>
            )}
            
            {!isSettingLocation && !qrError && (
              <p className="font-poppins text-green-600 mt-6">Session is active!</p>
            )}

            <button
              onClick={() => setShowQr(null)}
              className="mt-8 w-full bg-main-blue hover:opacity-90 text-white font-bold py-4 px-4 rounded-xl text-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- UPGRADED: Re-skinned ScheduleCard ---
function ScheduleCard({ cls, onShowQr }) {
  const isLive = cls.live;

  return (
    <div 
      className={`
        p-6 rounded-2xl shadow-lg border transition-all
        ${isLive ? 'bg-white border-main-blue' : 'bg-white border-gray-100'}
      `}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-2xl font-bold text-gray-900">{cls.code} - {cls.name}</h2>
            {isLive && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                LIVE
              </span>
            )}
          </div>
          <p className="font-poppins text-md text-gray-600">{cls.startTime} - {cls.endTime} | Students Present: {cls.student_count}</p>
        </div>

        <div className="mt-4 sm:mt-0">
          {isLive && (
            <button
              onClick={() => onShowQr(cls.code)}
              className="w-full sm:w-auto px-6 py-3 font-bold bg-main-blue text-white rounded-xl shadow-md transition-all hover:opacity-90 transform hover:scale-105"
            >
              Show QR Code
            </button>
          )}
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
          reject(new Error('Please allow location access to start the session.'));
        } else {
          reject(new Error('Could not get your location.'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}