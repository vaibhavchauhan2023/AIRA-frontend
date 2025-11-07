import { useState, useEffect } from 'react';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import { VerificationFlow } from './VerificationFlow';
import { Homepage } from './Homepage';
import { Header } from './Header';

export const API_NODE = 'https://aira-backend-phi.vercel.app';
export const API_PYTHON = import.meta.env.VITE_API_PYTHON || 'http://localhost:5000';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [verifyingClass, setVerifyingClass] = useState(null);
  
  const getInitialPage = () => {
    if (window.location.pathname === '/login') {
      return 'login';
    }
    // If user is logged in, default to their dashboard
    if (currentUser) {
      return 'dashboard';
    }
    return 'home';
  };
  const [page, setPage] = useState(getInitialPage);

  useEffect(() => {
    // When user logs in or out, update the page
    if (currentUser && page !== 'dashboard') {
      setPage('dashboard');
    }
    if (!currentUser && page === 'dashboard') {
      setPage('home');
    }
  }, [currentUser]);

  useEffect(() => {
    let path = '/';
    if (page === 'login') path = '/login';
    if (page === 'dashboard') path = '/dashboard';

    // Only update URL if it's different
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, [page]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setPage('dashboard'); // <-- Go to dashboard on login
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPage('home');
  };

  const startVerification = (classCode) => { setVerifyingClass(classCode); };
  const cancelVerification = () => { setVerifyingClass(null); };
  const verificationSuccess = (message) => {
    alert('Attendance Marked! ' + message);
    setVerifyingClass(null);
  };

  // --- RENDER LOGIC ---

  // A) User is marking attendance (no header)
  if (verifyingClass) {
    return (
      <VerificationFlow
        classCode={verifyingClass}
        userId={currentUser?.id}
        onCancel={cancelVerification}
        onSuccess={verificationSuccess}
      />
    );
  }

  // B) Main App Layout (Header + Page Content)
  return (
    <div className="relative w-full min-h-screen bg-white text-gray-900 overflow-hidden font-sans">
      {/* Background Aura */}
      <div className="absolute top-[-25rem] left-1/2 -translate-x-1/2 w-[100rem] h-[100rem] z-0 opacity-80 pointer-events-none">
        <div 
          className="w-full h-full rounded-full" 
          style={{
            background: 'radial-gradient(circle, #EBF4FF 0%, transparent 70%)',
            filter: 'blur(150px)',
          }}
        />
      </div>
      
      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto px-6 py-8 z-10 flex flex-col min-h-screen">
        
        {/* --- The Header is now ALWAYS visible (unless verifying) --- */}
        <Header 
          activePage={page} 
          onLoginClick={() => setPage('login')} 
          onHomeClick={() => setPage('home')}
          onLogoutClick={handleLogout} // <-- Pass logout handler
          isLoggedIn={!!currentUser}  // <-- Tell header if user is logged in
        />
        
        {/* Main content area */}
        <main className="flex-grow flex flex-col pt-10 md:pt-16">
          {page === 'home' && (
            <div className="overflow-y-auto">
              <Homepage onLoginClick={() => setPage('login')} />
            </div>
          )}

          {page === 'login' && (
            <div className="flex-grow flex items-center justify-center">
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            </div>
          )}

          {page === 'dashboard' && currentUser && (
            <>
              {currentUser.type === 'student' && (
                <StudentDashboard
                  user={currentUser}
                  onMarkAttendance={startVerification}
                />
              )}
              {currentUser.type === 'teacher' && (
                <TeacherDashboard user={currentUser} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}


// ===================================================================
// LOGIN PAGE COMPONENT (No changes needed)
// ===================================================================
function LoginPage({ onLoginSuccess }) {
  // (This component is the same as before)
  // ...
  const [userType, setUserType] = useState('student');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_NODE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType, userId, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }
      onLoginSuccess({
        ...result.user,
        timetable: result.timetable,
      });
    } catch (err) {
      setError(err.message || 'Failed to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  const studentBtnStyles = userType === 'student'
    ? 'bg-main-blue text-white'
    : 'text-gray-600 hover:bg-gray-100';
  const teacherBtnStyles = userType === 'teacher'
    ? 'bg-main-blue text-white'
    : 'text-gray-600 hover:bg-gray-100';

  return (
    <div className="w-full max-w-md p-10 space-y-6 bg-white rounded-3xl shadow-2xl border border-gray-100">
      
      <div className="text-center">
        <h1 className="text-4xl font-bold text-main-blue">AIRA</h1>
        <p className="font-poppins text-gray-600">Secure AI-Powered Attendance</p>
      </div>

      <div className="flex w-full p-2 bg-gray-50 rounded-2xl">
        <button
          onClick={() => setUserType('student')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${studentBtnStyles}`}
        >
          Student
        </button>
        <button
          onClick={() => setUserType('teacher')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${teacherBtnStyles}`}
        >
          Teacher
        </button>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        
        <div>
          <label htmlFor="user-id" className="block text-sm font-semibold text-gray-700 mb-2">
            {userType === 'student' ? 'Student ID' : 'Teacher ID'}
          </label>
          <input
            id="user-id"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-4 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-main-blue"
            placeholder={userType === 'student' ? 'e.g., e23cseu01183' : 'e.g., ashwanisharma'}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-4 text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-main-blue"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}

        <div>
          <button
            type="submit"
            className="w-full py-4 mt-2 font-bold text-white bg-main-blue rounded-xl text-lg transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-main-blue focus:ring-offset-2 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </div>
      </form>
    </div>
  );
}