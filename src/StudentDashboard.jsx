import { useState, useEffect } from 'react';

export default function StudentDashboard({ user, onMarkAttendance }) {
  // ... (No changes to this part) ...
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

// --- UPGRADED: TimetableCard ---
function TimetableCard({ cls, onMarkAttendance }) {
  const isLive = cls.live;
  const isMarked = cls.isMarked; // Get the new prop

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

        {/* --- THIS LOGIC IS UPGRADED --- */}
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
              className="w-full sm:w-auto px-6 py-3 font-bold bg-green-600 text-white rounded-xl opacity-80"
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