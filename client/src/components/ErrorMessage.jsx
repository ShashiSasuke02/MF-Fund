/**
 * Error message component with variants
 * variants: 'inline' | 'banner' | 'modal' | 'centered' (default)
 */
export default function ErrorMessage({ message, onRetry, variant = 'centered' }) {
  if (!message) return null;

  // Banner Variant (Top of forms)
  if (variant === 'banner') {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg flex items-start shadow-sm mb-6 animate-pulse-once">
        <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <span className="block sm:inline font-medium">{message}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="ml-2 underline text-red-800 hover:text-red-900 text-sm font-semibold"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Inline Variant (Field level)
  if (variant === 'inline') {
    return (
      <div className="flex items-center mt-1 text-xs text-red-600 animate-slide-down">
        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{message}</span>
      </div>
    );
  }

  // Centered Variant (Page level / Section level)
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-gray-500 text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Empty state component
 */
export function EmptyState({ title, message, icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        {icon || (
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center max-w-md">{message}</p>
    </div>
  );
}
