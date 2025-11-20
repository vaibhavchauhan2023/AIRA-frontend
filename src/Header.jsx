import React from 'react';

// --- UPGRADE ---
// Now accepts 'isLoggedIn' and 'onLogoutClick'
export function Header({ activePage, onLoginClick, onHomeClick, isLoggedIn, onLogoutClick }) {
  
  const getNavStyles = (pageName) => {
    if (pageName === activePage) {
      return "text-main-blue font-semibold bg-light-blue px-6 py-3 rounded-2xl transition-all duration-200 cursor-pointer";
    }
    return "text-gray-600 hover:text-main-blue font-medium transition-colors duration-200 cursor-pointer";
  };

  const handleNavClick = (e, page) => {
    e.preventDefault(); 
    if (page === 'home') { onHomeClick(); }
    if (page === 'features') { onHomeClick(); }
    if (page === 'how-it-works') { onHomeClick(); }
  };

  return (
    <header className="flex justify-between z-10 items-center bg-white backdrop-blur-lg pl-10 pr-5 py-4 bg-white rounded-3xl shadow-[0px_4px_73.9000015258789px_0px_rgba(62,121,255,0.20)]">
      
      <a 
        onClick={(e) => handleNavClick(e, 'home')}
        className="text-4xl font-extrabold text-main-blue tracking-tight cursor-pointer"
      >
        AIRA
      </a>
      
      {/* --- UPDATE: Hide nav links when logged in --- */}
      {!isLoggedIn && (
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
      )}
      
      {/* --- UPDATE: Show Logout button when logged in --- */}
      {isLoggedIn ? (
        <button
          onClick={onLogoutClick}
          className="bg-gray-200 text-gray-800 font-semibold text-lg px-8 py-3 rounded-2xl shadow-md hover:bg-gray-300 transition-opacity duration-200"
        >
          Log Out
        </button>
      ) : (
        <button
          onClick={onLoginClick}
          className="bg-main-blue text-white font-semibold text-lg px-8 py-3 rounded-2xl shadow-md hover:opacity-90 transition-opacity duration-200"
        >
          Log In
        </button>
      )}
    </header>
  );
}