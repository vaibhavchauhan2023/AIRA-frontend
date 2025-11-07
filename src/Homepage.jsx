import React from 'react';
// We no longer import Header here

export function Homepage({ onLoginClick }) {
  return (
    // Note: The main div and background are now handled by App.jsx
    // This component now just returns its own content.
    <>
      {/* --- Hero Section --- */}
      <div className="relative pt-40 pb-32 text-center">
        
        {/* Floating Tag 1: Face Verified */}
        <div className="absolute top-64 -left-12 md:left-24 flex items-center space-x-3 bg-white px-5 py-3 rounded-full shadow-lg border border-gray-100 animate-pulse-slow">
          <img src="/icons/smiley.png" alt="Face Verified" className="w-7 h-7" />
          <span className="font-semibold text-gray-700 text-lg">Face Verified</span>
        </div>
        
        {/* Floating Tag 2: Location Verified */}
        <div className="absolute top-36 -right-12 md:right-24 flex items-center space-x-3 bg-white px-5 py-3 rounded-full shadow-lg border border-gray-100 animate-pulse-slow delay-200">
          <img src="/icons/map-pin.png" alt="Location Verified" className="w-7 h-7" />
          <span className="font-semibold text-gray-700 text-lg">Location Verified</span>
        </div>

        {/* Hero Content */}
        <div className="relative max-w-4xl mx-auto">
          <div className="flex justify-center items-center space-x-5 mb-6">
            <span className="text-7xl font-extrabold text-main-blue tracking-tight">AIRA</span>
            <img src="/icons/sparkle.png" alt="Sparkle" className="w-14 h-14" />
          </div>
          
          <h1 className="text-7xl font-extrabold text-gray-900 leading-tight mb-7">
            The Future of Attendance
          </h1>
          
          <p className="font-poppins text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            AI-Powered Identity & Recognition Attendance,
            proxy-proof attendance verification for your classroom.
          </p>
          
          <button className="bg-main-blue text-white font-bold text-xl px-12 py-5 rounded-2xl shadow-xl hover:opacity-90 transition-all duration-200 transform hover:scale-105">
            Register Your Institute
          </button>
        </div>
      </div>

      {/* --- Bottom Feature Bubbles --- */}
      <div className="relative flex flex-wrap justify-center gap-8 pt-20">
        <FeatureBubble icon="/icons/liveness.png" text="Liveness Detection" />
        <FeatureBubble icon="/icons/face.png" text="Face Detection" />
        <FeatureBubble icon="/icons/location.png" text="Location Verification" />
      </div>
    </>
  );
}

// --- Small helper component for the bubbles at the bottom ---
function FeatureBubble({ icon, text }) {
  return (
    <div className="flex items-center space-x-4 bg-white px-8 py-4 rounded-full shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
      <img src={icon} alt={text} className="w-8 h-8" />
      <span className="font-semibold text-gray-700 text-lg">{text}</span>
    </div>
  );
}