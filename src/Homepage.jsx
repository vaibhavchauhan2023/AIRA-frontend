import React from 'react';
// We no longer import Header here

export function Homepage({ onLoginClick }) {
  return (
    // Note: The main div and background are now handled by App.jsx
    // This component now just returns its own content.
    <>
      {/* --- Hero Section --- */}


      <div className="w-full pt-32 pb-32 text-center">
        <div class="absolute top-0 flex items-center justify-center">
          <img src="./src/assets/bg-img.png" alt="Hero Background"  />
        </div>
        
        {/* Floating Tag 1: Face Verified */}
        <div className="absolute top-96 -left-0 md:left56 flex items-center space-x-3 bg-white px-5 py-3 rounded-xl shadow-[0px_4px_73.9000015258789px_0px_rgba(62,121,255,0.20)] border border-gray-100 animate-pulse-slow">
          <img src="/icons/smiley.png" alt="Face Verified" className="w-7 h-7" />
          <span className="font-semibold text-gray-700 text-lg">Face Verified</span>
        </div>
        
        {/* Floating Tag 2: Location Verified */}
        <div className="absolute top-56 -right-12 md:right24 flex items-center space-x-3 bg-white px-5 py-3 rounded-xl shadow-[0px_4px_73.9000015258789px_0px_rgba(62,121,255,0.20)] border border-gray-100 animate-pulse-slow delay-200">
          <img src="/icons/map-pin.png" alt="Location Verified" className="w-7 h-7" />
          <span className="font-semibold text-gray-700 text-lg">Location Verified</span>
        </div>

        {/* Hero Content */}
        <div class="w-full inline-flex flex-col justify-start items-center gap-16">
          <div class="w-[754px] flex flex-col justify-start items-center gap-10">
            <div class="self-stretch flex flex-col justify-start items-center gap-5">
              <div class="self-stretch flex flex-col justify-start items-center gap-2">
                <div class="self-stretch inline-flex justify-center items-center gap-8">
                  <div class="flex justify-start items-center gap-5">
                    <div class="justify-start text-blue-600 text-6xl font-bold font-['Inter']">AIRA</div>
                    <img class="w-24 h-24 origin-center rotate-180" src="./src/assets/ai.png" />
                  </div>
                  <div class="justify-start text-slate-800 text-6xl font-semibold font-['Inter']">The Future of</div>
                </div>
                <div class="self-stretch text-center justify-start text-slate-800 text-6xl font-semibold font-['Inter']">Attendance</div>
              </div>
              <div class="text-center justify-start text-zinc-400 text-2xl font-normal font-['Poppins']">AI-Powered Identity & Recognition Attendance,<br/>proxy-proof attendance verification for your classroom.</div>
            </div>
              <button className="bg-main-blue text-white font-bold text-xl px-12 py-5 rounded-2xl shadow-xl hover:opacity-90 transition-all duration-200 transform hover:scale-105">
                Register Your Institute
              </button>
          </div>
          <div class="self-stretch inline-flex justify-center items-center gap-14">
            <div class="px-5 py-2.5 rounded-[200px] outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-start items-center gap-2.5 overflow-hidden">
              <div class="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                <img class="w-4 h-4" src="./src/assets/live.png"/>
              </div>
              <div class="justify-start text-slate-800 text-base font-medium font-['Inter']">Liveness Detection</div>
            </div>
            <div class="px-5 py-2.5 rounded-[200px] outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-start items-center gap-2.5 overflow-hidden">
             <div class="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
              <img class="w-4 h-4" src="./src/assets/face-id.png" />
             </div>
             <div class="justify-start text-slate-800 text-base font-medium font-['Inter']">Face Detection</div>
            </div>
            <div class="px-5 py-2.5 rounded-[200px] outline outline-1 outline-offset-[-1px] outline-neutral-200 flex justify-start items-center gap-2.5 overflow-hidden">
             <div class="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
              <img class="w-4 h-4" src="./src/assets/location-pin.png" />
             </div>
             <div class="justify-start text-slate-800 text-base font-medium font-['Inter']">Location Verification</div>
            </div>
          </div>
        </div>
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