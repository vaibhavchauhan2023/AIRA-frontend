import { useState, useEffect } from 'react';
import { API_NODE } from './App'; // Import the API URL

// Pass 'onMarkAttendance' prop from App.jsx
export default function StudentDashboard({ user, onLogout, onMarkAttendance }) {
  const [timetable, setTimetable] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // This hook now just gets the timetable from the user prop
  useEffect(() => {
    setTimetable(user.timetable || []);
    setIsLoading(false);
  }, [user]);

  // The alert is gone, we now call the function from App.jsx
  const handleMarkAttendance = (classCode) => {
    onMarkAttendance(classCode);
  };

  // (The rest of the JSX is the same as before)
  // ... (rest of the StudentDashboard component) ...
  return (
    <div className="flex justify-center min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="w-full max-w-3xl">
        <header className="flex justify-between items-center w-full mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
            <p className="text-gray-400">Today's Timetable</p>
          </div>
          <button
            onClick={onLogout}
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Logout
          </button>
        </header>
        <main className="w-full space-y-4">
          {isLoading ? (
            <p className="text-center text-gray-400">Loading timetable...</p>
          ) : timetable.length > 0 ? (
            timetable.map((cls) => (
              <TimetableCard 
                key={cls.id} 
                cls={cls} 
                onMarkAttendance={handleMarkAttendance} 
              />
            ))
          ) : (
             <p className="text-center text-gray-400">No classes scheduled for today.</p>
          )}
        </main>
      </div>
    </div>
  );
}

function TimetableCard({ cls, onMarkAttendance }) {
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
          <p className="text-sm text-gray-400">{cls.time} | {cls.teacher}</p>
        </div>
        <div className="mt-4 sm:mt-0">
          {isLive && (
            <button
              onClick={() => onMarkAttendance(cls.code)}
              className="w-full sm:w-auto px-5 py-2.5 font-medium bg-cyan-600 text-white rounded-lg transition-colors hover:bg-cyan-700"
            >
              Mark Attendance
            </button>
          )}
        </div>
      </div>
    </div>
  );
}