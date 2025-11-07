import React from 'react';

export function Header({ activePage, onLoginClick, onHomeClick }) {
  
  const getNavStyles = (pageName) => {
    if (pageName === activePage) {
      return "text-main-blue font-semibold bg-light-blue px-6 py-3 rounded-2xl transition-all duration-200 cursor-pointer";
    }
    return "text-gray-600 hover:text-main-blue font-medium transition-colors duration-200 cursor-pointer";
  };

  const handleNavClick = (e, page) => {
    e.preventDefault(); 
    
    if (page === 'home') { onHomeClick(); }
    if (page === 'features') { onHomeClick(); } // For now, "Features" goes home
    if (page === 'how-it-works') { onHomeClick(); } // For now, "How it works" goes home
  };

  return (
    <header className="flex justify-between items-center bg-white/70 backdrop-blur-lg h-24 px-10 rounded-3xl shadow-lg border border-gray-100">
      
      {/* --- UPDATE: Logo is now a clickable link --- */}
      <a 
        onClick={(e) => handleNavClick(e, 'home')}
        className="text-4xl font-extrabold text-main-blue tracking-tight cursor-pointer"
      >
        AIRA
      </a>
      {/* ------------------------------------------- */}

      <nav className="hidden md:flex items-center space-x-12">
        <a 
          onClick={(e) => handleNavClick(e, 'home')} 
          className={getNavStyles('home')}
        >
          Home
        </a>
        <a 
          onClick={(e) => handleNavClick(e, 'features')}
          className={getNavStyles('features')}
        >
          Features
        </a>
        <a 
          onClick={(e) => handleNavClick(e, 'how-it-works')}
          className={getNavStyles('how-it-works')}
        >
          How it works?
        </a>
      </nav>
      <button
        onClick={onLoginClick}
        className="bg-main-blue text-white font-semibold text-lg px-8 py-3 rounded-2xl shadow-md hover:opacity-90 transition-opacity duration-200"
      >
        Log In
      </button>
    </header>
  );
}