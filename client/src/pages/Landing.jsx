import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Carousel timing: 3 seconds display + 0.4 seconds transition
  useEffect(() => {
    if (prefersReducedMotion) return; // Don't animate if user prefers reduced motion

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveSection((prev) => (prev + 1) % 4);
        setIsTransitioning(false);
      }, 400); // Transition duration
    }, 3400); // Total cycle time (3s display + 0.4s transition)

    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  // Section content data
  const sections = [
    {
      id: 'hero',
      title: 'Practice Investing Without the Risk',
      content: (
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Practice Investing Without the Risk
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed">
            Master mutual fund investing with real market data and zero financial risk. Create your portfolio, track returns, and build confidence before investing real money.
          </p>
          <div className="flex justify-center">
            <Link
              to={isAuthenticated ? "/portfolio" : "/register"}
              className="inline-block px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-lg"
            >
              Start Free Practice Account
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 'value',
      title: 'Why TryMutualFunds?',
      content: (
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Why TryMutualFunds?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Risk-Free Learning</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Learn the fundamentals of mutual fund investing without putting your money on the line.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Real Market Data</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Track your dummy portfolio with live market data based on actual fund performance.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Build Confidence</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Make mistakes, learn from them, and develop your investment strategy before committing real capital.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'steps',
      title: 'Get Started in 3 Simple Steps',
      content: (
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Get Started in 3 Simple Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Create Your Account</h3>
              <p className="text-gray-600 leading-relaxed">
                Sign up in seconds with no credit card required. Your practice account comes ready to use.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Build Your Portfolio</h3>
              <p className="text-gray-600 leading-relaxed">
                Browse available mutual funds and allocate your virtual capital. Experiment with different strategies.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Track & Learn</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor your portfolio's performance with real-time data. See how your decisions play out in the real market.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: 'Everything You Need to Learn Investing',
      content: (
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Learn Investing
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Real-Time Market Data', desc: 'Practice with actual fund performance' },
              { title: 'Diverse Fund Selection', desc: 'Access various mutual fund categories' },
              { title: 'Portfolio Tracking', desc: 'Monitor returns and analyze performance' },
              { title: 'Zero Risk Environment', desc: 'Learn from mistakes without consequences' },
              { title: 'Instant Setup', desc: 'Start practicing immediately' },
              { title: 'Performance Analytics', desc: 'Understand your returns with visual insights' }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start space-x-4 p-4 bg-white rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">✓ {feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  const getOpacity = (index) => {
    if (prefersReducedMotion) {
      return activeSection === index ? 1 : 0;
    }
    if (activeSection === index) {
      return isTransitioning ? 0 : 1;
    }
    return 0;
  };

  return (
    <div className="min-h-screen">
      {/* Animated Carousel Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-40 overflow-hidden min-h-[650px] md:min-h-[700px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {sections.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSection(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeSection === index ? 'w-8 bg-emerald-500' : 'w-2 bg-gray-300'
                }`}
                aria-label={`Go to section ${index + 1}`}
              />
            ))}
          </div>

          {/* Carousel Container */}
          <div className="relative">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="transition-opacity duration-400 ease-in-out"
                style={{
                  opacity: getOpacity(index),
                  pointerEvents: activeSection === index ? 'auto' : 'none',
                  position: index === 0 ? 'relative' : 'absolute',
                  top: index === 0 ? 'auto' : 0,
                  left: index === 0 ? 'auto' : 0,
                  right: index === 0 ? 'auto' : 0
                }}
              >
                {section.content}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-20 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12 md:mb-16">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Is this really free?</h3>
              <p className="text-gray-600 leading-relaxed">
                Yes! TryMutualFunds is completely free. No credit card, no hidden fees, no catches.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Is this real money?</h3>
              <p className="text-gray-600 leading-relaxed">
                No, you're investing with virtual money in a risk-free environment. However, the fund data and returns are based on real market performance.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Do I need investment experience?</h3>
              <p className="text-gray-600 leading-relaxed">
                Not at all! TryMutualFunds is perfect for beginners who want to learn and experienced investors who want to test strategies.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">How accurate is the data?</h3>
              <p className="text-gray-600 leading-relaxed">
                We use real-time market data, so your practice portfolio reflects actual mutual fund performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-20 bg-emerald-500/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-xl text-emerald-50 mb-10">
            Join today and start building your investment skills with zero risk.
          </p>
          <Link
            to={isAuthenticated ? "/portfolio" : "/register"}
            className="inline-block px-12 py-4 bg-white text-emerald-600 font-bold text-lg rounded-md shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Create Free Account
          </Link>
          
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-emerald-50">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>100% Free Forever</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Start in Under 60 Seconds</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
