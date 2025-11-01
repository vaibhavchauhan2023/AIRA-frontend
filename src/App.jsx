import { useState } from 'react';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import { VerificationFlow } from './VerificationFlow'; // Import the new component

// --- API Endpoints ---
// This is the base URL of our Node.js backend
export const API_NODE = 'http://localhost:4000';
// This is the base URL of our Python AI backend
export const API_PYTHON = 'http://localhost:5000';


export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // NEW state to manage the verification process
  const [verifyingClass, setVerifyingClass] = useState(null); // e.g., 'CS-306'

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // --- NEW HANDLERS ---
  const startVerification = (classCode) => {
    setVerifyingClass(classCode);
  };

  const cancelVerification = () => {
    setVerifyingClass(null);
  };

  const verificationSuccess = (message) => {
    alert('Attendance Marked! ' + message); // Show a simple success alert
    setVerifyingClass(null); // Go back to the dashboard
  };
  // --------------------

  // 1. If user is marking attendance, show the verification flow
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

  // 2. If no one is logged in, show the LoginPage
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. If a student is logged in, show their dashboard
  if (currentUser.type === 'student') {
    return (
      <StudentDashboard
        user={currentUser}
        onLogout={handleLogout}
        onMarkAttendance={startVerification} // Pass the new handler
      />
    );
  }

  // 4. If a teacher is logged in, show their dashboard
  if (currentUser.type === 'teacher') {
    return <TeacherDashboard user={currentUser} onLogout={handleLogout} />;
  }
}

// ===================================================================
// LOGIN PAGE COMPONENT
// ===================================================================
function LoginPage({ onLoginSuccess }) {
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
      // This now calls our live Node.js server
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

  // (All the JSX styling for LoginPage is the same as before)
  // ... (rest of the LoginPage component) ...
  const studentBtnStyles = userType === 'student'
    ? 'bg-cyan-600 text-white'
    : 'text-gray-300';
  const teacherBtnStyles = userType === 'teacher'
    ? 'bg-cyan-600 text-white'
    : 'text-gray-300';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyan-400">ProxyZero</h1>
          <p className="text-gray-400">Secure AI-Powered Attendance</p>
        </div>
        <div className="flex w-full p-1 bg-gray-700 rounded-lg">
          <button
            onClick={() => setUserType('student')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${studentBtnStyles}`}
          >
            Student
          </button>
          <button
            onClick={() => setUserType('teacher')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${teacherBtnStyles}`}
          >
            Teacher
          </button>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="user-id" className="block text-sm font-medium text-gray-300 mb-1">
              {userType === 'student' ? 'Student ID' : 'Teacher ID'}
            </label>
            <input
              id="user-id"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-3 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder={userType === 'student' ? 'e.g., 101' : 'e.g., 201'}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-3 text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}
          <div>
            <button
              type="submit"
              className="w-full py-3 font-bold text-white bg-cyan-600 rounded-lg transition-colors hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}