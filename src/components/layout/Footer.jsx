import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRightLong,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaLocationDot,
  FaPhone,
  FaYoutube,
  FaXTwitter,
} from 'react-icons/fa6';
import { CONTACT_DETAILS } from '../../data/contactDetails';
import { postNewsletterSubscription } from '../../services/api';

const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle');

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();

    if (!newsletterEmail.trim()) {
      return;
    }

    setNewsletterStatus('submitting');

    try {
      await postNewsletterSubscription({
        email: newsletterEmail,
        source: 'footer',
      });
      setNewsletterStatus('success');
      setNewsletterEmail('');
    } catch (_error) {
      setNewsletterStatus('error');
    }
  };

  return (
    <footer className="bg-primary text-white pt-12 sm:pt-16 pb-6 sm:pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-12">
          {/* Logo & Description */}
          <div className="text-center sm:text-left">
            <Link to="/">
              <img src="/footer-logo.png" alt="Era Creatio Developers LLP" className="h-16 w-auto mb-3 sm:mb-4 mx-auto sm:mx-0" />
            </Link>
            <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">
              Redefining luxury living in Kerala since 2018. Building dreams, creating legacies.
            </p>
            <div className="flex space-x-3 sm:space-x-4 justify-center sm:justify-start">
              <a href="https://www.facebook.com/profile.php?id=100064388880293" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white bg-opacity-10 rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                <FaFacebookF className="text-sm sm:text-base" />
              </a>
              <a href="https://www.instagram.com/eracreatio_developers" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white bg-opacity-10 rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                <FaInstagram className="text-base sm:text-lg" />
              </a>
              {/* <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white bg-opacity-10 rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                <FaLinkedinIn className="text-sm sm:text-base" />
              </a> */}
              <a
                href="https://x.com/Eragroupeofcom1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-all duration-300"
              >
                <FaXTwitter className="text-sm sm:text-base" />
              </a>

              <a
                href="https://www.youtube.com/channel/UCAVMaq2D1Xfy2ntmgRHdc2A"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300"
              >
                <FaYoutube className="text-sm sm:text-base" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h3 className="font-serif text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><Link to="/" className="text-gray-400 text-sm sm:text-base hover:text-accent transition-colors">Home</Link></li>
              <li><Link to="/villa-projects" className="text-gray-400 text-sm sm:text-base hover:text-accent transition-colors">Villa Projects</Link></li>
              <li><Link to="/independent-residences" className="text-gray-400 text-sm sm:text-base hover:text-accent transition-colors">Independent Residences</Link></li>
              <li><Link to="/commercial-projects" className="text-gray-400 text-sm sm:text-base hover:text-accent transition-colors">Commercial Projects</Link></li>
              <li><Link to="/about" className="text-gray-400 text-sm sm:text-base hover:text-accent transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center sm:text-left">
            <h3 className="font-serif text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Contact Us</h3>
            <ul className="space-y-2 sm:space-y-3 text-gray-400 text-sm sm:text-base">
              <li className="flex items-start justify-center sm:justify-start">
                <FaLocationDot className="mr-2 mt-1 shrink-0" />
                <span>
                  {CONTACT_DETAILS.addressLines[0]}
                  <br />
                  {CONTACT_DETAILS.addressLines[1]}
                </span>
              </li>
              <li className="flex items-center justify-center sm:justify-start">
                <FaPhone className="mr-2 shrink-0" />
                <span>{CONTACT_DETAILS.phones[0]}</span>
              </li>
              <li className="flex items-center justify-center sm:justify-start">
                <FaPhone className="mr-2 shrink-0" />
                <span>{CONTACT_DETAILS.phones[1]}</span>
              </li>
              <li className="flex items-center justify-center sm:justify-start">
                <FaEnvelope className="mr-2 shrink-0" />
                <span className="break-all">{CONTACT_DETAILS.email}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="text-center sm:text-left">
            <h3 className="font-serif text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Newsletter</h3>
            <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4">Subscribe to get updates on new projects and offers.</p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Your email"
                required
                className="flex-1 px-3 sm:px-4 py-2 bg-white bg-opacity-10 rounded-luxury sm:rounded-l-luxury sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-accent text-sm sm:text-base mb-2 sm:mb-0"
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'submitting'}
                className="bg-accent px-4 sm:px-6 py-2 rounded-luxury sm:rounded-l-none sm:rounded-r-luxury hover:bg-opacity-90 transition-colors text-sm sm:text-base disabled:opacity-60"
              >
                <FaArrowRightLong className="mx-auto" />
              </button>
            </form>
            {newsletterStatus === 'success' && (
              <p className="text-xs sm:text-sm text-green-300 mt-2">Subscribed successfully.</p>
            )}
            {newsletterStatus === 'error' && (
              <p className="text-xs sm:text-sm text-red-300 mt-2">Could not subscribe right now.</p>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <p className="text-gray-400 text-xs sm:text-sm mb-3 md:mb-0">
            © 2026 Era Creatio Developers LLP. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm">
            <Link to="/privacy" className="text-gray-400 hover:text-accent transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-accent transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
