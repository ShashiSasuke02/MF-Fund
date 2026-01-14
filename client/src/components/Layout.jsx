import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

/**
 * Main layout component with mobile-optimized header and navigation
 */
export default function Layout({ children }) {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);
  
  // Close mobile menu on route change
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);
  
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with glassmorphism effect */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo with gradient */}
            <Link to="/" className="flex items-center space-x-2 md:space-x-3 group" onClick={closeMobileMenu}>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent hidden sm:inline">
                TryMutualFunds
              </span>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent sm:hidden">
                TMF
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              <Link
                to="/"
                className={`px-4 xl:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  location.pathname === '/'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Home
              </Link>
              <Link
                to="/browse"
                className={`px-4 xl:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  location.pathname === '/browse' || location.pathname.startsWith('/amc') || location.pathname.startsWith('/fund')
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Browse Funds
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/portfolio"
                    className={`px-4 xl:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      location.pathname === '/portfolio'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Portfolio
                  </Link>
                  <Link
                    to="/invest"
                    className={`px-4 xl:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      location.pathname === '/invest'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Invest
                  </Link>
                  <div className="h-8 w-px bg-gray-300 mx-2"></div>
                  <span className="text-sm text-gray-600 px-3 hidden xl:inline">
                    {user?.username}
                  </span>
                  <button
                    onClick={logout}
                    className="px-4 xl:px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-300"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`px-4 xl:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      location.pathname === '/login'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 xl:px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
            
            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        <div
          className={`lg:hidden fixed inset-0 top-16 md:top-20 bg-black bg-opacity-50 transition-opacity duration-300 ${
            mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeMobileMenu}
        >
          <div
            className={`bg-white h-full w-64 sm:w-80 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col p-4 space-y-2">
              {/* User info section for mobile */}
              {isAuthenticated && (
                <div className="pb-4 mb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{user?.username}</p>
                      <p className="text-xs text-gray-500">{user?.emailId}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Navigation Links */}
              <Link
                to="/"
                className={`px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                  location.pathname === '/'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={closeMobileMenu}
              >
                🏠 Home
              </Link>
              <Link
                to="/browse"
                className={`px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                  location.pathname === '/browse' || location.pathname.startsWith('/amc') || location.pathname.startsWith('/fund')
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={closeMobileMenu}
              >
                📊 Browse Funds
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/portfolio"
                    className={`px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                      location.pathname === '/portfolio'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    💼 Portfolio
                  </Link>
                  <Link
                    to="/invest"
                    className={`px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 ${
                      location.pathname === '/invest'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    💰 Invest
                  </Link>
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        logout();
                        closeMobileMenu();
                      }}
                      className="w-full px-4 py-3 rounded-xl text-base font-semibold text-red-600 hover:bg-red-50 transition-all duration-300 text-left"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
                    <Link
                      to="/login"
                      className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-300 text-center ${
                        location.pathname === '/login'
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                      }`}
                      onClick={closeMobileMenu}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 text-center"
                      onClick={closeMobileMenu}
                    >
                      Register
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main content with padding for fixed header */}
      <main className="flex-1 py-4 md:py-8">
        {children}
      </main>
      
      {/* Footer with glassmorphism */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-white/20 py-6 md:py-8 mt-8 md:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 text-center sm:text-left">
            <p className="text-xs sm:text-sm text-gray-600">
              Mutual Fund data powered by{' '}
              <a 
                href="https://www.mfapi.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent hover:underline"
              >
                MFapi.in
              </a>
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              © {new Date().getFullYear()} TryMutualFunds
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
