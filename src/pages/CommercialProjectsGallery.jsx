import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaArrowLeftLong } from 'react-icons/fa6';
import ResidenceGallery from '../components/ResidenceGallery';
import { commercialGallery } from '../data/projectsData';
import { getPublicGalleries } from '../services/api';

const filterOptions = ['all', 'ongoing', 'completed'];

const CommercialProjectsGallery = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [galleryCollections, setGalleryCollections] = useState(commercialGallery);

  useEffect(() => {
    let isMounted = true;

    async function loadGalleries() {
      try {
        const data = await getPublicGalleries();

        if (!isMounted) {
          return;
        }

        setGalleryCollections({
          ongoing: Array.isArray(data.commercial?.ongoing) ? data.commercial.ongoing : [],
          completed: Array.isArray(data.commercial?.completed) ? data.commercial.completed : [],
        });
      } catch (_error) {
        if (isMounted) {
          setGalleryCollections(commercialGallery);
        }
      }
    }

    loadGalleries();

    return () => {
      isMounted = false;
    };
  }, []);

  const allWorks = useMemo(
    () => [...(galleryCollections.ongoing || []), ...(galleryCollections.completed || [])],
    [galleryCollections]
  );

  const filteredImages = useMemo(() => {
    if (activeFilter === 'all') {
      return allWorks;
    }

    return allWorks.filter((item) => item.category === activeFilter);
  }, [activeFilter, allWorks]);

  return (
    <div className="pt-20 sm:pt-24 bg-white min-h-screen">
      <section className="relative py-16 sm:py-20 overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/70" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-white text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            Commercial Projects Gallery
          </motion.h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-200 max-w-3xl mx-auto mb-8">
            Explore all our ongoing and completed commercial project works in one place.
          </p>
          <Link
            to="/commercial-projects"
            className="inline-flex items-center gap-2 border border-white/40 text-white px-6 py-2.5 rounded-luxury hover:bg-white hover:text-primary transition-all text-sm sm:text-base"
          >
            <FaArrowLeftLong />
            <span>Back to Commercial Projects</span>
          </Link>
        </div>
      </section>

      <section className="py-14 sm:py-20 bg-bgLight">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center mb-8 sm:mb-10">
            <div className="inline-flex bg-white rounded-luxury p-1.5 shadow-md flex-wrap gap-1">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setActiveFilter(option)}
                  className={`px-4 sm:px-5 py-2.5 rounded-luxury text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all ${
                    activeFilter === option
                      ? 'bg-accent text-white shadow'
                      : 'text-textGrey hover:text-primary'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <ResidenceGallery
            images={filteredImages}
            category={activeFilter}
            showExpandControls={false}
          />
        </div>
      </section>
    </div>
  );
};

export default CommercialProjectsGallery;
