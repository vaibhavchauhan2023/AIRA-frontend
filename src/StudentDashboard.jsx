import { useState, useEffect } from 'react';

// --- UPGRADE: No longer needs 'onLogout' ---
export default function StudentDashboard({ user, onMarkAttendance }) {
  const [timetable, setTimetable] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimetable(user.timetable || []);
    setIsLoading(false);
  }, [user]);

  const handleMarkAttendance = (classCode) => {
    onMarkAttendance(classCode);
  };

  return (
    // --- UPGRADED: Removed the old dark container ---
    <div className="w-full max-w-5xl mx-auto">
      
      {/* --- UPGRADED: New Header Style --- */}
      <header className="flex justify-between items-center w-full mb-10">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Welcome, {user.name}!</h1>
          <p className="font-poppins text-xl text-gray-600">Today's Timetable</p>
        </div>
      </header>

      {/* Timetable Section */}
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

// --- UPGRADED: Re-skinned TimetableCard ---
function TimetableCard({ cls, onMarkAttendance }) {
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
          <p className="font-poppins text-md text-gray-600">{cls.startTime} - {cls.endTime} | {cls.teacher}</p>
        </div>

        <div className="mt-4 sm:mt-0">
          {isLive && (
            <button
              onClick={() => onMarkAttendance(cls.code)}
              className="w-full sm:w-auto px-6 py-3 font-bold bg-main-blue text-white rounded-xl shadow-md transition-all hover:opacity-90 transform hover:scale-105"
            >
              Mark Attendance
            </button>
          )}
        </div>
      </div>
    </div>
  );
}