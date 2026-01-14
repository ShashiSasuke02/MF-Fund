import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { BannerAd, DisplayAd, RectangleAd } from '../components/AdSense';

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
          <div className="inline-flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-emerald-200 mb-6">
            <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-semibold text-emerald-700">100% Risk-Free Learning Platform</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6 bg-gradient-to-r from-gray-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
            Practice Investing Without the Risk
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed">
            Master mutual fund investing with real market data and zero financial risk. Create your portfolio, track returns, and build confidence before investing real money.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to={isAuthenticated ? "/portfolio" : "/register"}
              className="inline-flex items-center px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 text-lg"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Start Free Practice Account
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-emerald-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">No Credit Card</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-emerald-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Always Free</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-emerald-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Real Market Data</span>
            </div>
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
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 transform">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">Risk-Free Learning</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Learn the fundamentals of mutual fund investing without putting your money on the line.
              </p>
            </div>
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 transform">
                  <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-teal-700 transition-colors">Real Market Data</h3>
              <p className="text-gray-600 leading-relaxed text-base">
                Track your dummy portfolio with live market data based on actual fund performance.
              </p>
            </div>
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 transform">
                  <svg className="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-cyan-700 transition-colors">Build Confidence</h3>
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
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl text-3xl font-bold group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 transform">
                  1
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-emerald-300 to-transparent"></div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">Create Your Account</h3>
              <p className="text-gray-600 leading-relaxed">
                Sign up in seconds with no credit card required. Your practice account comes ready to use.
              </p>
            </div>
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl text-3xl font-bold group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 transform">
                  2
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-teal-300 to-transparent"></div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-teal-700 transition-colors">Build Your Portfolio</h3>
              <p className="text-gray-600 leading-relaxed">
                Browse available mutual funds and allocate your virtual capital. Experiment with different strategies.
              </p>
            </div>
            <div className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl text-3xl font-bold group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 transform">
                  3
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-cyan-300 to-transparent"></div>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-cyan-700 transition-colors">Track & Learn</h3>
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
              <div key={idx} className="flex items-start space-x-4 p-5 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group hover:scale-[1.02]">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30">
      {/* Top Banner Ad */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <BannerAd />
        </div>
      </div>

      {/* Animated Carousel Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-40 overflow-hidden min-h-[650px] md:min-h-[700px]">
        {/* Animated decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Progress Indicators */}
          <div className="flex justify-center gap-3 mb-8">
            {sections.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSection(index)}
                className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${
                  activeSection === index 
                    ? 'w-12 bg-gradient-to-r from-emerald-500 to-teal-600' 
                    : 'w-2.5 bg-gray-300 hover:bg-gray-400'
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

      {/* Mid-page Display Ad */}
      <div className="bg-white/60 backdrop-blur-sm border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DisplayAd />
        </div>
      </div>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-20 bg-gradient-to-br from-gray-50 to-emerald-50/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-emerald-200 mb-4">
              <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-emerald-700">Got Questions?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Is this really free?</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Yes! TryMutualFunds is completely free. No credit card, no hidden fees, no catches.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Is this real money?</h3>
                  <p className="text-gray-600 leading-relaxed">
                    No, you're investing with virtual money in a risk-free environment. However, the fund data and returns are based on real market performance.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Do I need investment experience?</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Not at all! TryMutualFunds is perfect for beginners who want to learn and experienced investors who want to test strategies.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl hover:border-emerald-200 transition-all duration-300">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">How accurate is the data?</h3>
                  <p className="text-gray-600 leading-relaxed">
                    We use real-time market data, so your practice portfolio reflects actual mutual fund performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgNC40MTgtMy41ODIgOC04IDhzLTgtMy41ODItOC04IDMuNTgyLTggOC04IDggMy41ODIgOCA4eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full shadow-lg mb-6">
            <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span className="text-sm font-semibold text-white">Join Thousands of Practice Investors</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Start Your Investment Journey?
          </h2>
          <p className="text-xl text-emerald-50 mb-10 max-w-2xl mx-auto">
            Join today and start building your investment skills with zero risk.
          </p>
          <Link
            to={isAuthenticated ? "/portfolio" : "/register"}
            className="inline-flex items-center px-12 py-5 bg-white text-emerald-600 font-bold text-lg rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 hover:bg-gray-50"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Create Free Account Now
          </Link>
          
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-white">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">100% Free Forever</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Start in Under 60 Seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Rectangle Ad */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <RectangleAd />
          </div>
        </div>
      </div>
    </div>
  );
}
