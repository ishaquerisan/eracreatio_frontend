import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CTASection = () => {
  return (
    <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1920&q=80)'
        }}
      >
        <div className="absolute inset-0 bg-primary/90"></div>
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-4">
            Ready to Find Your Dream Home?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
            Schedule a site visit and experience luxury living firsthand. Our team is ready to guide you.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-accent text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-luxury hover:bg-opacity-90 transition-all font-medium text-base sm:text-lg"
          >
            Book a Site Visit
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
