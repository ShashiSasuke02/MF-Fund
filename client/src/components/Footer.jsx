import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Footer() {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full mix-blend-multiply filter blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-600/10 rounded-full mix-blend-multiply filter blur-3xl"></div>
      
      {/* Disclaimer Section */}
      <div className="relative z-10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-bold text-amber-400 mb-2">Investment Disclaimer</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Mutual Fund investments are subject to market risks. Please read all scheme-related documents carefully before investing. 
                  Past performance is not indicative of future returns. TryMutualFunds.com is a practice platform for educational purposes. 
                  This is a demo application using virtual money for learning investment strategies without financial risk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-4 lg:gap-12">
            {/* Column 1: About */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                About
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Why Choose Us
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Our Mission
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Products */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                Invest
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/browse" className="text-gray-400 hover:text-teal-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Mutual Funds
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-teal-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    SIP Calculator
                  </Link>
                </li>
                <li>
                  <Link to="/invest" className="text-gray-400 hover:text-teal-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Lump Sum Investment
                  </Link>
                </li>
                <li>
                  <Link to="/browse" className="text-gray-400 hover:text-teal-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Tax Saving Funds (ELSS)
                  </Link>
                </li>
                <li>
                  <Link to="/portfolio" className="text-gray-400 hover:text-teal-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    My Portfolio
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Risk Disclosure
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Disclaimer
                  </Link>
                </li>
                <li>
                  <Link to="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Grievance Redressal
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                Get In Touch
              </h3>
              <div className="space-y-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:support@trymutualfunds.com" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                    support@trymutualfunds.com
                  </a>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-emerald-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-gray-400">
                    <p>Business Hours:</p>
                    <p>Mon-Fri, 9 AM - 6 PM IST</p>
                  </div>
                </div>
              </div>

              <h4 className="text-sm font-bold text-white mb-4">Follow Us</h4>
              <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all transform hover:scale-110 group">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all transform hover:scale-110 group">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all transform hover:scale-110 group">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all transform hover:scale-110 group">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all transform hover:scale-110 group">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Mobile Accordion Layout */}
          <div className="lg:hidden space-y-4">
            {/* About Section */}
            <div className="border-b border-gray-800">
              <button
                onClick={() => toggleSection('about')}
                className="w-full flex items-center justify-between py-4 text-white font-bold"
              >
                <span className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  About
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${expandedSection === 'about' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSection === 'about' && (
                <ul className="pb-4 space-y-3">
                  <li><Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors block">About Us</Link></li>
                  <li><Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors block">How It Works</Link></li>
                  <li><Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors block">Why Choose Us</Link></li>
                  <li><Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors block">Our Mission</Link></li>
                  <li><Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors block">Contact Us</Link></li>
                  <li><Link to="/" className="text-gray-400 hover:text-emerald-400 text-sm transition-colors block">Careers</Link></li>
                </ul>
              )}
            </div>

            {/* Products Section */}
            <div className="border-b border-gray-800">
              <button
                onClick={() => toggleSection('products')}
                className="w-full flex items-center justify-between py-4 text-white font-bold"
              >
                <span className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  Invest
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${expandedSection === 'products' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSection === 'products' && (
                <ul className="pb-4 space-y-3">
                  <li><Link to="/browse" className="text-gray-400 hover:text-teal-400 text-sm transition-colors block">Mutual Funds</Link></li>
                  <li><Link to="/" className="text-gray-400 hover:text-teal-400 text-sm transition-colors block">SIP Calculator</Link></li>
                  <li><Link to="/invest" className="text-gray-400 hover:text-teal-400 text-sm transition-colors block">Lump Sum Investment</Link></li>
                  <li><Link to="/browse" className="text-gray-400 hover:text-teal-400 text-sm transition-colors block">Tax Saving Funds (ELSS)</Link></li>
                  <li><Link to="/portfolio" className="text-gray-400 hover:text-teal-400 text-sm transition-colors block">My Portfolio</Link></li>
                </ul>
              )}
            </div>

            {/* Legal Section */}
            <div className="border-b border-gray-800">
              <button
                onClick={() => toggleSection('legal')}
                className="w-full flex items-center justify-between py-4 text-white font-bold"
              >
                <span className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  Legal
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${expandedSection === 'legal' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSection === 'legal' && (
                <ul className="pb-4 space-y-3">
                  <li><Link to="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors block">Terms & Conditions</Link></li>
                  <li><Link to="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors block">Privacy Policy</Link></li>
                  <li><Link to="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors block">Risk Disclosure</Link></li>
                  <li><Link to="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors block">Disclaimer</Link></li>
                  <li><Link to="/" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors block">Grievance Redressal</Link></li>
                </ul>
              )}
            </div>

            {/* Contact Section */}
            <div>
              <button
                onClick={() => toggleSection('contact')}
                className="w-full flex items-center justify-between py-4 text-white font-bold"
              >
                <span className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Get In Touch
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${expandedSection === 'contact' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSection === 'contact' && (
                <div className="pb-4 space-y-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-emerald-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:support@trymutualfunds.com" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                      support@trymutualfunds.com
                    </a>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-emerald-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-gray-400">
                      <p>Business Hours:</p>
                      <p>Mon-Fri, 9 AM - 6 PM IST</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-3">Follow Us</h4>
                    <div className="flex space-x-3">
                      <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                      <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                      <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                      <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                      <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all">
                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center">
            <p className="text-sm text-gray-400 flex items-center">
              Made with <span className="text-red-500 mx-1">❤️</span> in India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
