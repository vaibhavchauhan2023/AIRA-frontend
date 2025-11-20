import { useState, useEffect, useCallback } from 'react';
import { API_NODE } from './App';
import { QRCodeSVG } from 'qrcode.react';
import { MdVisibility, MdClose, MdAccessTime } from 'react-icons/md'; // Icons

export default function TeacherDashboard({ user }) {
  const [schedule, setSchedule] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // QR State
  const [showQr, setShowQr] = useState(null); 
  const [qrError, setQrError] = useState(null);
  const [isSettingLocation, setIsSettingLocation] = useState(false);

  // Attendance List State
  const [viewAttendance, setViewAttendance] = useState(null); // Stores classCode we are viewing
  const [studentList, setStudentList] = useState([]); // Stores the fetched list

  const fetchSchedule = useCallback(async () => {
    try {
      const response = await fetch(`${API_NODE}/api/user-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userType: 'teacher' }),
      });
      if (response.ok) {
        const data = await response.json();
        setSchedule(data.timetable || []);
      }
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  }, [user.id]);

  useEffect(() => {
    fetchSchedule();
    const interval = setInterval(fetchSchedule, 5000);
    return () => clearInterval(interval);
  }, [fetchSchedule]);

  const handleShowQr = async (classCode) => {
    setQrError(null);
    setShowQr(classCode);
    setIsSettingLocation(true);
    try {
      const coords = await getGPSCoordinates();
      await fetch(`${API_NODE}/api/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, coords }),
      });
      setIsSettingLocation(false);
      fetchSchedule();
    } catch (err) {
      setIsSettingLocation(false);
      setQrError(err.message || 'Failed to get location.');
    }
  };

  // --- NEW: Fetch and Show Attendance List ---
  const handleViewAttendance = async (classCode) => {
    setViewAttendance(classCode);
    setStudentList([]); // Clear old data
    try {
      const response = await fetch(`${API_NODE}/api/class-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode }),
      });
      const data = await response.json();
      if (data.success) {
        setStudentList(data.students);
      }
    } catch (err) {
      console.error("Failed to fetch attendance list", err);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto relative">
      <header className="flex justify-between items-center w-full mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Welcome, {user.name}!</h1>
          <p className="font-poppins text-xl text-gray-600">Today's Schedule</p>
        </div>
      </header>

      <main className="w-full space-y-4">
        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : schedule.length > 0 ? (
          schedule.map((cls) => (
            <ScheduleCard 
              key={cls.id} 
              cls={cls} 
              onShowQr={handleShowQr} 
              onViewAttendance={handleViewAttendance} // Pass the handler
            />
          ))
        ) : (
          <p className="text-center text-gray-500 py-20">No classes today.</p>
        )}
      </main>

      {/* QR Modal */}
      {showQr && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center w-full max-w-md animate-fade-in">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Scan to Join</h2>
            <p className="text-gray-500 mb-6">{showQr}</p>
            
            <div className="bg-white p-3 rounded-xl border-2 border-gray-100 inline-block shadow-sm">
              <QRCodeSVG value={showQr} size={220} />
            </div>

            {isSettingLocation && <p className="text-gray-500 mt-4 animate-pulse">Acquiring GPS location...</p>}
            {qrError && <p className="text-red-500 mt-4">{qrError}</p>}
            {!isSettingLocation && !qrError && <p className="text-green-600 mt-4 font-medium">Session Active</p>}

            <button onClick={() => { setShowQr(null); fetchSchedule(); }} className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-4 rounded-xl transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Attendance List Modal */}
      {viewAttendance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh] animate-slide-up">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Present Students</h2>
                <p className="text-sm text-gray-500">Class: {viewAttendance}</p>
              </div>
              <button onClick={() => setViewAttendance(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MdClose size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {studentList.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No students have marked attendance yet.</p>
              ) : (
                <div className="space-y-3">
                  {studentList.map((student, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">{student.userId}</p>
                      </div>
                      <div className="flex items-center gap-1 text-main-blue bg-blue-50 px-3 py-1 rounded-lg">
                        <MdAccessTime size={16} />
                        <span className="font-mono font-medium text-sm">{student.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
               <div className="flex justify-between text-lg font-bold text-gray-700">
                 <span>Total Present:</span>
                 <span>{studentList.length}</span>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleCard({ cls, onShowQr, onViewAttendance }) {
  const isLive = cls.live;

  return (
    <div className={`p-6 rounded-2xl shadow-lg border transition-all ${isLive ? 'bg-white border-main-blue' : 'bg-white border-gray-100'}`}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h2 className="text-2xl font-bold text-gray-900">{cls.code} - {cls.name}</h2>
            {isLive && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse tracking-wider">LIVE</span>}
          </div>
          <p className="text-gray-600">{cls.startTime} - {cls.endTime}</p>
          <p className="text-gray-500 text-sm mt-1">
            Students Present: <span className="font-bold text-main-blue text-lg ml-1">{cls.presentCount}</span>
          </p>
        </div>

        {isLive && (
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={() => onShowQr(cls.code)}
              className="px-6 py-3 font-bold bg-main-blue text-white rounded-xl shadow-md hover:opacity-90 transition-all active:scale-95"
            >
              Show QR
            </button>
            <button
              onClick={() => onViewAttendance(cls.code)}
              className="px-6 py-3 font-bold bg-white text-main-blue border-2 border-main-blue rounded-xl shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <MdVisibility size={20} /> View List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Keep your existing getGPSCoordinates function at the bottom...
function getGPSCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error('Location access denied.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}