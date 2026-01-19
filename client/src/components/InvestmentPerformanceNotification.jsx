import { useEffect, useState } from 'react';

export default function InvestmentPerformanceNotification({ portfolioSummary, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification after a brief delay for smooth appearance
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [portfolioSummary]);

  if (!portfolioSummary) {
    return null;
  }

  const { totalReturns = 0, returnsPercentage = 0, totalInvested = 0 } = portfolioSummary;
  const isPositive = totalReturns >= 0;
  const hasInvestments = totalInvested > 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const getMessage = () => {
    // Special message for new users with no investments yet
    if (!hasInvestments) {
      return `Welcome! You haven't made any investments yet. Start your investment journey today with ₹1,00,00,000 demo balance. Explore funds, learn strategies, and build your portfolio risk-free!`;
    }
    
    if (isPositive) {
      return `Great news! Today your investment has grown by ${formatCurrency(totalReturns)} (${returnsPercentage.toFixed(2)}%). Keep up the momentum—explore more opportunities to grow your wealth!`;
    } else {
      return `Today your investment is down by ${formatCurrency(totalReturns)} (${Math.abs(returnsPercentage).toFixed(2)}%). Market fluctuations are normal—stay informed and discover strategies to strengthen your portfolio.`;
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Icon */}
          <div className={`p-6 rounded-t-2xl ${
            !hasInvestments
              ? 'bg-gradient-to-br from-blue-50 to-indigo-50'
              : isPositive 
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50' 
                : 'bg-gradient-to-br from-orange-50 to-amber-50'
          }`}>
            <div className="flex items-center justify-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                !hasInvestments
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  : isPositive
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    : 'bg-gradient-to-br from-orange-500 to-amber-600'
              }`}>
                {!hasInvestments ? (
                  // Welcome/Rocket icon for new users
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ) : isPositive ? (
                  // Upward trending chart icon
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ) : (
                  // Information/Learning icon
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
              </div>
            </div>

            <h2 className={`text-2xl font-bold text-center mb-2 ${
              !hasInvestments
                ? 'text-blue-800'
                : isPositive ? 'text-emerald-800' : 'text-orange-800'
            }`}>
              {!hasInvestments ? 'Welcome to TryMutualFunds!' : isPositive ? 'Investment Update' : 'Market Update'}
            </h2>

            {/* Performance Badge - Only show if user has investments */}
            {hasInvestments && (
              <div className={`inline-flex items-center px-4 py-2 rounded-full mx-auto ${
                isPositive 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                <span className="text-lg font-semibold">
                  {isPositive ? '+' : '-'}{formatCurrency(totalReturns)}
                </span>
                <span className="mx-2">•</span>
                <span className="text-lg font-semibold">
                  {isPositive ? '+' : '-'}{Math.abs(returnsPercentage).toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="p-6">
            <p className="text-gray-700 text-center leading-relaxed mb-6">
              {getMessage()}
            </p>

            {/* Action Button */}
            <button
              onClick={handleClose}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                !hasInvestments
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                  : isPositive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                    : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
              }`}
            >
              {!hasInvestments ? "Let's Get Started!" : "OK, Got It!"}
            </button>
          </div>

          {/* Decorative Bottom Border */}
          <div className={`h-2 rounded-b-2xl ${
            !hasInvestments
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
              : isPositive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                : 'bg-gradient-to-r from-orange-500 to-amber-600'
          }`} />
        </div>
      </div>
    </>
  );
}
