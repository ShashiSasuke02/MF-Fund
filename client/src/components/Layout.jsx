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
                  {(user?.id === 1 || user?.username === 'admin') && (
                    <Link
                      to="/admin/dashboard"
                      className="text-gray-700 hover:text-gray-900 font-medium text-base transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  <div className="hidden lg:flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{user?.emailId || user?.email_id}</span>
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

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="text-lg font-bold text-gray-900">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col p-4 space-y-4 overflow-y-auto h-full pb-20">
            <Link
              to="/browse"
              className="block py-2 text-gray-700 font-medium text-lg hover:text-emerald-600 border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Mutual Funds
            </Link>
            <Link
              to="/calculators"
              className="block py-2 text-gray-700 font-medium text-lg hover:text-emerald-600 border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Calculators
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/portfolio"
                  className="block py-2 text-gray-700 font-medium text-lg hover:text-emerald-600 border-b border-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Portfolio
                </Link>
                <Link
                  to="/invest"
                  className="block py-2 text-gray-700 font-medium text-lg hover:text-emerald-600 border-b border-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Invest
                </Link>
                {(user?.id === 1 || user?.username === 'admin') && (
                  <Link
                    to="/admin/dashboard"
                    className="block py-2 text-gray-700 font-medium text-lg hover:text-emerald-600 border-b border-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 text-red-600 font-medium text-lg border-b border-gray-100 hover:text-red-700"
                >
                  Logout
                </button>
                <div className="pt-2 text-sm text-gray-500 truncate">
                  Signed in as: <span className="font-medium text-gray-700">{user?.emailId || user?.email_id}</span>
                </div>
              </>
            )}
            {!isAuthenticated && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Link
                  to="/login"
                  className="flex items-center justify-center px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center px-4 py-3 text-center text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
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
