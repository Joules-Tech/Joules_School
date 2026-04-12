'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import LanguageToggle from './LanguageToggle';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">J</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Joules School
            </span>
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="#features" className="nav-link">
              Features
            </Link>
            <Link href="#about" className="nav-link">
              About
            </Link>
            <Link href="#pricing" className="nav-link">
              Pricing
            </Link>
            <Link href="#contact" className="nav-link">
              Contact
            </Link>
          </div>

          {/* Right Side - Language + Auth Buttons */}
          <div className="flex items-center space-x-3">
            <LanguageToggle />
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="btn-primary text-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
