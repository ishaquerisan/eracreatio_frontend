import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const slides = [
  {
    id: 1,
    title: "Redefining the Art of Living.",
    subtitle: "Luxury Villa Communities in the heart of Kerala.",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80",
    cta: "Explore Villas",
    link: "/villa-projects"
  },
  {
    id: 2,
    title: "Custom Homes, Built for Generations.",
    subtitle: "Bespoke Independent Residences tailored to your dreams.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",
    cta: "View Residences",
    link: "/independent-residences"
  },
  {
    id: 3,
    title: "Modern Spaces for Modern Business.",
    subtitle: "Iconic Commercial Developments with high ROI.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80",
    cta: "Discover Projects",
    link: "/commercial-projects"
  }
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    /**
     * MOBILE: aspect-[4/3] makes the slider taller than a standard video (16:9).
     * DESKTOP: md:h-screen restores the full-screen immersive experience.
     */
    <div className="relative w-full aspect-[4/3] md:aspect-auto md:h-screen overflow-hidden bg-neutral-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Background Image Container */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[5000ms] scale-105"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          >
            {/* Enhanced Gradient for readability on taller mobile view */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 md:bg-gradient-to-r md:from-black/70 md:via-black/40 md:to-transparent"></div>
          </div>

          {/* Content Overlay */}
          <div className="relative h-full flex items-center">
            <div className="container mx-auto px-6 sm:px-10 lg:px-12">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="max-w-xs sm:max-w-md md:max-w-3xl"
              >
                {/* Font sizes optimized for the new taller mobile height */}
                <h1 className="font-serif text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-3 md:mb-6 leading-tight">
                  {slides[currentSlide].title}
                </h1>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-gray-200 mb-6 md:mb-8 line-clamp-2 md:line-clamp-none">
                  {slides[currentSlide].subtitle}
                </p>
                <Link
                  to={slides[currentSlide].link}
                  className="inline-block bg-white text-black px-6 py-3 md:px-10 md:py-4 rounded-sm hover:bg-neutral-200 transition-all font-semibold text-xs md:text-lg uppercase tracking-widest"
                >
                  {slides[currentSlide].cta}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators (Pagination dots) */}
      <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-500 rounded-full ${
              index === currentSlide 
                ? 'bg-white w-10 h-1' 
                : 'bg-white/40 w-2 h-1 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Desktop Scroll Indicator - Hidden on Mobile */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="hidden md:flex absolute bottom-10 right-12 text-white/80 items-center space-x-3"
      >
        <span className="text-xs uppercase tracking-[0.2em] font-light">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-white/80 to-transparent"></div>
      </motion.div>
    </div>
  );
};

export default HeroSlider;