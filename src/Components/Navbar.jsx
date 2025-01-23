import React, { useState } from 'react';
import { Button } from './Button';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Docs', href: '/docs' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' }
  ];

  return (
    <div className="relative">
      <nav className="w-full h-14 border-b border-gray-800 bg-black shadow-lg shadow-cyan-500/50">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Logo and Site Name */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-800 rounded-md flex items-center justify-center">
              <span className="text-cyan-400 font-bold">K</span>
            </div>
            <span className="text-xl font-bold text-white">KodeSesh</span>
          </div>

          {/* Combined Navigation Links and Auth Buttons */}
          <div className="hidden md:flex items-center">
            {/* Navigation Links */}
            <div className="flex items-center space-x-6 mr-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost">
                Sign In
              </Button>
              <Button>
                Sign Up
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute right-4 top-16 w-48 bg-black border border-gray-800 rounded-md shadow-lg md:hidden z-50">
          <div className="py-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="border-t border-gray-800 mt-2 pt-2 px-4 space-y-2">
              <Button 
                variant="ghost" 
                className="w-full text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Button>
              <Button 
                className="w-full text-left"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
