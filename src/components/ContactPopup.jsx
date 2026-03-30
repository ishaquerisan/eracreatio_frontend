import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCircleCheck, FaHouse, FaXmark } from 'react-icons/fa6';
import { postContactInquiry } from '../services/api';

const ContactPopup = ({ onClose }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', interest: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setForm({ ...form, phone: digitsOnly });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    if (!/^\d{10}$/.test(form.phone)) {
      setErrorMessage('Phone number must be exactly 10 digits.');
      setIsSubmitting(false);
      return;
    }

    if (!form.interest) {
      setErrorMessage('Please select an interest.');
      setIsSubmitting(false);
      return;
    }

    try {
      await postContactInquiry({
        name: form.name,
        email: form.email,
        phone: form.phone,
        interest: form.interest,
        source: 'contact-popup',
      });
      setSubmitted(true);
      setTimeout(() => onClose(), 2200);
    } catch (error) {
      setErrorMessage(error.message || 'Could not submit right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.88, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Gold top bar */}
          <div className="h-1.5 w-full bg-accent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-accent hover:text-white text-gray-500 flex items-center justify-center transition-colors text-lg leading-none"
            aria-label="Close"
          >
            <FaXmark />
          </button>

          <div className="px-6 sm:px-8 pt-7 pb-8">
            {!submitted ? (
              <>
                {/* Heading */}
                <div className="text-center mb-6">
                  <FaHouse className="text-3xl mb-3 mx-auto text-accent" />
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-primary leading-snug">
                    Enter Your Details and Get a<br />
                    Call Back from Our Dedicated<br />
                    Support Team
                  </h2>
                  <div className="w-10 h-0.5 bg-accent mx-auto mt-3" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-gray-50 placeholder-gray-400"
                  />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-gray-50 placeholder-gray-400"
                  />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    minLength={10}
                    placeholder="Phone Number"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-gray-50 placeholder-gray-400"
                  />
                  <select
                    name="interest"
                    value={form.interest}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-gray-50 placeholder-gray-400"
                  >
                    <option value="">Select Interest</option>
                    <option value="villa">Villa Projects</option>
                    <option value="independent">Independent Residences</option>
                    <option value="commercial">Commercial Projects</option>
                    <option value="renovation">Renovation</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-3.5 rounded-xl hover:bg-accent transition-colors font-semibold tracking-wide text-sm sm:text-base mt-1 disabled:opacity-60"
                  >
                    {isSubmitting ? 'SENDING...' : 'CONTACT US'}
                  </button>
                </form>
                {errorMessage && (
                  <p className="text-center text-xs text-red-500 mt-3">{errorMessage}</p>
                )}

                <p className="text-center text-xs text-gray-400 mt-4">
                  We respect your privacy. No spam, ever.
                </p>
              </>
            ) : (
              /* Success state */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <FaCircleCheck className="text-5xl mb-4 mx-auto text-green-500" />
                <h3 className="font-serif text-xl font-bold text-primary mb-2">Thank You!</h3>
                <p className="text-textGrey text-sm">
                  Our support team will call you back shortly.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ContactPopup;
