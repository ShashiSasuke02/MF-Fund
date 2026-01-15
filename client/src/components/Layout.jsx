import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import Footer from './Footer';

export default function Layout({ children }) {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col bg-white" 
      style={{
        backgroundImage: 'url(/background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}>
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-lg md:text-xl font-bold text-gray-900">TryMutualFunds</span>
            </Link>
            
            {/* Desktop Navigation - Centered */}
            <nav className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
              <Link
                to="/browse"
                className="text-gray-700 hover:text-gray-900 font-medium text-base transition-colors"
              >
                Mutual Funds
              </Link>
              <Link
                to="/calculators"
                className="text-gray-700 hover:text-gray-900 font-medium text-base transition-colors"
              >
                Calculators
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/portfolio"
                    className="text-gray-700 hover:text-gray-900 font-medium text-base transition-colors"
                  >
                    Portfolio
                  </Link>
                  <Link
                    to="/invest"
                    className="text-gray-700 hover:text-gray-900 font-medium text-base transition-colors"
                  >
                    Invest
                  </Link>
                </>
              )}
            </nav>
            
            {/* Right side buttons */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  <div className="hidden lg:flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{user?.username}</span>
                    <button
                      onClick={logout}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden md:inline-block px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-2.5 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-md shadow-sm transition-all"
                  >
                    Sign up
                  </Link>
                </>
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              <Link
                to="/browse"
                className="block py-2 text-gray-700 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mutual Funds
              </Link>
              <Link
                to="/calculators"
                className="block py-2 text-gray-700 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Calculators
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/portfolio"
                    className="block py-2 text-gray-700 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Portfolio
                  </Link>
                  <Link
                    to="/invest"
                    className="block py-2 text-gray-700 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Invest
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 text-gray-700 font-medium"
                  >
                    Logout ({user?.username})
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="block py-2 text-gray-700 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
