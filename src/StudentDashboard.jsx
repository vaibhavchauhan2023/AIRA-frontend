import { useState, useEffect, useCallback } from 'react';
import { API_NODE } from './App';

export default function StudentDashboard({ user, onMarkAttendance }) {
  const [timetable, setTimetable] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch the latest timetable data
  const fetchTimetable = useCallback(async () => {
    try {
      // We re-use the login endpoint logic to get the updated user data
      // Note: In a real app, you'd have a specific endpoint like /api/student/timetable
      // For now, we can re-fetch the user data if we have the credentials,
      // BUT a better way for this specific setup is to ask the App.jsx to refresh the user.
      
      // Since we don't have the password here to re-login, we will rely on a prop 
      // or a new endpoint. 
      
      // Let's add a simple endpoint to the backend to get "my details" using just the ID.
      // Ideally this is protected by a token, but for this project:
      const response = await fetch(`${API_NODE}/api/user-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userType: 'student' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimetable(data.timetable || []);
      }
    } catch (error) {
      console.error("Failed to refresh timetable", error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  // Initial load
  useEffect(() => {
    fetchTimetable();
    
    // Set up a poller to refresh data every 5 seconds (optional, but good for "live" feel)
    const interval = setInterval(fetchTimetable, 5000);
    return () => clearInterval(interval);
  }, [fetchTimetable]);

  const handleMarkAttendance = (classCode) => {
    onMarkAttendance(classCode, fetchTimetable); // Pass refresh callback
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <header className="flex justify-between items-center w-full mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Welcome, {user.name}!</h1>
          <p className="font-poppins text-xl text-gray-600">Today's Timetable</p>
        </div>
      </header>
      <main className="w-full space-y-4">
        {isLoading ? (
          <p className="text-center font-poppins text-gray-500">Loading timetable...</p>
        ) : timetable.length > 0 ? (
          timetable.map((cls) => (
            <TimetableCard 
              key={cls.id} 
              cls={cls} 
              onMarkAttendance={handleMarkAttendance} 
            />
          ))
        ) : (
           <p className="text-center font-poppins text-gray-500 py-20">No classes scheduled for today.</p>
        )}
      </main>
    </div>
  );
}

function TimetableCard({ cls, onMarkAttendance }) {
  const isLive = cls.live;
  const isMarked = cls.isMarked;

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
            {isLive && !isMarked && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                LIVE
              </span>
            )}
            {isMarked && (
              <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                MARKED
              </span>
            )}
          </div>
          <p className="font-poppins text-md text-gray-600">{cls.startTime} - {cls.endTime} | {cls.teacher}</p>
        </div>

        <div className="mt-4 sm:mt-0">
          {isLive && !isMarked && (
            <button
              onClick={() => onMarkAttendance(cls.code)}
              className="w-full sm:w-auto px-6 py-3 font-bold bg-main-blue text-white rounded-xl shadow-md transition-all hover:opacity-90 transform hover:scale-105"
            >
              Mark Attendance
            </button>
          )}
          {isLive && isMarked && (
             <button
              className="w-full sm:w-auto px-6 py-3 font-bold bg-green-600 text-white rounded-xl opacity-80 cursor-default"
              disabled
            >
              Attendance Marked
            </button>
          )}
        </div>
      </div>
    </div>
  );
}