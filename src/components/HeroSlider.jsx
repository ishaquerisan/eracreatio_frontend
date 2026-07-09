import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getPublicHeroSlides } from '../services/api';

const fallbackSlides = [
  {
    id: 1,
    title: 'Redefining the Art of Living.',
    subtitle: 'Luxury Villa Communities in the heart of Kerala.',
    imageUrl: '/home/1.jpeg',
    ctaText: 'Explore Villas',
    linkUrl: '/villa-projects',
    sortOrder: 1,
  },
  {
    id: 2,
    title: 'Custom Homes, Built for Generations.',
    subtitle: 'Bespoke Independent Residences tailored to your dreams.',
    imageUrl: '/home/2.jpeg',
    ctaText: 'View Residences',
    linkUrl: '/independent-residences',
    sortOrder: 2,
  },
  {
    id: 3,
    title: 'Modern Spaces for Modern Business.',
    subtitle: 'Iconic Commercial Developments with high ROI.',
    imageUrl: '/home/3.jpeg',
    ctaText: 'Discover Projects',
    linkUrl: '/commercial-projects',
    sortOrder: 3,
  }
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadHeroSlides() {
      try {
        const response = await getPublicHeroSlides();
        if (!isMounted) {
          return;
        }

        const nextSlides = Array.isArray(response.slides) ? response.slides : [];
        setHeroSlides(nextSlides.slice(0, 5));
      } catch (_error) {
        if (isMounted) {
          setHeroSlides([]);
        }
      }
    }

    loadHeroSlides();

    return () => {
      isMounted = false;
    };
  }, []);

  const slides = heroSlides.length > 0 ? heroSlides : fallbackSlides;

  useEffect(() => {
    setCurrentSlide(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide] || slides[0];

  const renderCta = () => {
    if (!slide?.linkUrl || !slide?.ctaText) {
      return null;
    }

    const className = 'inline-block bg-white text-black px-6 py-3 md:px-10 md:py-4 rounded-sm hover:bg-neutral-200 transition-all font-semibold text-xs md:text-lg uppercase tracking-widest';

    if (slide.linkUrl.startsWith('/')) {
      return (
        <Link to={slide.linkUrl} className={className}>
          {slide.ctaText}
        </Link>
      );
    }

    return (
      <a href={slide.linkUrl} className={className} target="_blank" rel="noreferrer">
        {slide.ctaText}
      </a>
    );
  };

  return (
    <div className="relative w-full aspect-[4/3.6] md:aspect-auto md:h-screen overflow-hidden bg-neutral-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide?.id || currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[5000ms] scale-105"
            style={{ backgroundImage: `url(${slide?.imageUrl || slide?.image || ''})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 md:bg-gradient-to-r md:from-black/70 md:via-black/40 md:to-transparent"></div>
          </div>

          <div className="relative h-full flex items-center">
            <div className="container mx-auto px-6 sm:px-10 lg:px-12">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="max-w-xs sm:max-w-md md:max-w-3xl"
              >
                <h1 className="font-serif text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-3 md:mb-6 leading-tight">
                  {slide?.title}
                </h1>
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-gray-200 mb-6 md:mb-8 line-clamp-2 md:line-clamp-none">
                  {slide?.subtitle}
                </p>
                {renderCta()}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

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