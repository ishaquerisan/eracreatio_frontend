import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    interest: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your inquiry! We will contact you soon.');
    setFormData({ name: '', phone: '', interest: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="pt-20 sm:pt-24">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-primary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Get in Touch
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
              Ready to start your journey? We're here to help you find your dream property.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-bgLight">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-6 sm:mb-8">
                Contact Information
              </h2>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="bg-accent text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg sm:text-xl">
                    📍
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1 text-sm sm:text-base">Address</h3>
                    <p className="text-textGrey text-sm sm:text-base">
                      AP Complex, Kuttikattor,<br />
                      Calicut, Kerala - 673008
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="bg-accent text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg sm:text-xl">
                    📞
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1 text-sm sm:text-base">Phone</h3>
                    <p className="text-textGrey text-sm sm:text-base">+91 7907 30 40 50</p>
                    <p className="text-textGrey text-sm sm:text-base">+91 96452 87355</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="bg-accent text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg sm:text-xl">
                    ✉️
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1 text-sm sm:text-base">Email</h3>
                    <p className="text-textGrey text-sm sm:text-base break-all">eracreatiodevelopers@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="bg-accent text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg sm:text-xl">
                    🕐
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-1 text-sm sm:text-base">Working Hours</h3>
                    <p className="text-textGrey text-sm sm:text-base">Monday - Saturday: 9:00 AM - 6:00 PM</p>
                    <p className="text-textGrey text-sm sm:text-base">Sunday: By Appointment</p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="mt-6 sm:mt-8 bg-gray-300 rounded-xl sm:rounded-2xl h-48 sm:h-56 md:h-64 flex items-center justify-center">
                <p className="text-textGrey text-sm sm:text-base">Google Map Integration</p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-xl"
            >
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6">
                Send us a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-primary font-medium mb-2 text-sm sm:text-base">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-luxury focus:outline-none focus:ring-2 focus:ring-accent text-sm sm:text-base"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-primary font-medium mb-2 text-sm sm:text-base">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-luxury focus:outline-none focus:ring-2 focus:ring-accent text-sm sm:text-base"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div>
                  <label className="block text-primary font-medium mb-2 text-sm sm:text-base">
                    I'm Interested In
                  </label>
                  <select
                    name="interest"
                    value={formData.interest}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-luxury focus:outline-none focus:ring-2 focus:ring-accent text-sm sm:text-base"
                  >
                    <option value="">Select an option</option>
                    <option value="villa">Villa Projects</option>
                    <option value="independent">Independent Residences</option>
                    <option value="commercial">Commercial Projects</option>
                    <option value="renovation">Renovation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-primary font-medium mb-2 text-sm sm:text-base">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-luxury focus:outline-none focus:ring-2 focus:ring-accent resize-none text-sm sm:text-base"
                    placeholder="Tell us about your requirements..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-accent text-white py-3 sm:py-4 rounded-luxury hover:bg-opacity-90 transition-all font-medium text-base sm:text-lg"
                >
                  Submit Inquiry
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
