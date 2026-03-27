import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [villaDropdownOpen, setVillaDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Villa Projects', path: '/villa-projects', hasDropdown: true },
    { name: 'Independent Residences', path: '/independent-residences' },
    { name: 'Commercial Developments', path: '/commercial-projects' },
    { name: 'About Us', path: '/about' },
    { name: 'Knowledge Hub', path: '/blog' },
    { name: 'Contact Us', path: '/contact' }
  ];

  // Determine if header should have solid background
  const isHomePage = location.pathname === '/';
  const solidBg = !isHomePage || scrolled;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        solidBg ? 'bg-white shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/logo.svg"
              alt="Era Creatio Developers LLP"
              className="h-12 lg:h-14 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <div key={link.name} className="relative group">
                <Link
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-accent ${
                    solidBg ? 'text-primary' : 'text-white'
                  } ${location.pathname === link.path ? 'text-accent' : ''}`}
                  onMouseEnter={() => link.hasDropdown && setVillaDropdownOpen(true)}
                >
                  {link.name}
                </Link>
                
                {link.hasDropdown && villaDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-48 bg-white shadow-xl rounded-lg py-2"
                    onMouseLeave={() => setVillaDropdownOpen(false)}
                  >
                    <Link
                      to="/villa-projects?tab=ongoing"
                      className="block px-4 py-2 text-sm text-primary hover:bg-bgLight hover:text-accent transition-colors"
                    >
                      Ongoing Projects
                    </Link>
                    <Link
                      to="/villa-projects?tab=completed"
                      className="block px-4 py-2 text-sm text-primary hover:bg-bgLight hover:text-accent transition-colors"
                    >
                      Completed Projects
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA Button */}
          <Link
            to="/contact"
            className="hidden lg:block bg-accent text-white px-6 py-3 rounded-luxury hover:bg-opacity-90 transition-all font-medium"
          >
            Book a Site Visit
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden ${solidBg ? 'text-primary' : 'text-white'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="lg:hidden bg-white shadow-lg rounded-b-lg"
          >
            <nav className="flex flex-col py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-primary hover:bg-bgLight hover:text-accent transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="mx-4 mt-2 bg-accent text-white px-6 py-3 rounded-luxury text-center"
              >
                Book a Site Visit
              </Link>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
