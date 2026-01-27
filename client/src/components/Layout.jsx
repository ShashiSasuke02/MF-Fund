import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Footer from './Footer';
import NotificationCenter from './NotificationCenter';

export default function Layout({ children }) {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

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
        {/* Main Header Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-lg md:text-xl font-bold text-gray-900">TryMutualFunds</span>
            </Link>

            {/* Desktop Navigation - Centered (hidden on mobile) */}
            <nav className="hidden lg:flex items-center space-x-8 flex-1 justify-center">
              <Link
                to="/browse"
                className="text-gray-700 hover:text-gray-900 font-medium text-base transition-colors"
              >
                Asset Managements
              </Link>
              <Link
                to="/calculators"
                className="text-gray-700 hover:text-gray-900 font-medium text-base transition-colors"
              >
                Investment Calculator
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
                  {(user?.role === 'admin' || user?.id === 1 || user?.username === 'admin') && (
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

            {/* Right side buttons - Desktop */}
            <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  <NotificationCenter />
                  <span className="text-sm text-gray-600 hidden xl:inline">{user?.emailId || user?.email_id}</span>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
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
            </div>

            {/* Mobile: Auth buttons only */}
            <div className="flex lg:hidden items-center space-x-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <NotificationCenter />
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-all"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm transition-all"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar - Always visible on mobile, hidden on desktop */}
        <div className="lg:hidden border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-2">
            <nav className="flex items-center justify-center overflow-x-auto scrollbar-hide py-2 gap-1">
              <Link
                to="/browse"
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${location.pathname === '/browse' || location.pathname.startsWith('/amc/')
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Funds
                </span>
              </Link>
              <Link
                to="/calculators"
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${location.pathname === '/calculators'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Inv. Calc
                </span>
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    to="/portfolio"
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${location.pathname === '/portfolio'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Portfolio
                    </span>
                  </Link>
                  <Link
                    to="/invest"
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${location.pathname === '/invest'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Invest
                    </span>
                  </Link>
                  {(user?.role === 'admin' || user?.id === 1 || user?.username === 'admin') && (
                    <Link
                      to="/admin/dashboard"
                      className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${location.pathname === '/admin/dashboard'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin
                      </span>
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
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
