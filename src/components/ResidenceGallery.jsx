import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PREVIEW_LIMIT = 6;

/* ── Lightbox ── */
const Lightbox = ({ images, startIndex, onClose }) => {
  const [current, setCurrent] = useState(startIndex);
  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length);
  const next = () => setCurrent(i => (i + 1) % images.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-accent text-3xl sm:text-4xl leading-none z-10"
      >
        ✕
      </button>

      {/* Counter */}
      <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-xs sm:text-sm">
        {current + 1} / {images.length}
      </p>

      {/* Prev */}
      <button
        onClick={e => { e.stopPropagation(); prev(); }}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-accent text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl transition-colors z-10"
      >
        ‹
      </button>

      {/* Image */}
      <motion.div
        key={current}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={images[current].src}
          alt={images[current].location}
          className="max-w-full max-h-[75vh] rounded-xl object-contain shadow-2xl"
        />
        <div className="mt-4 flex items-center gap-2 text-white/80 text-sm sm:text-base">
          <span className="text-accent">📍</span>
          <span>{images[current].location}</span>
        </div>
      </motion.div>

      {/* Next */}
      <button
        onClick={e => { e.stopPropagation(); next(); }}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-accent text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl transition-colors z-10"
      >
        ›
      </button>

      {/* Thumbnail strip */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-xs sm:max-w-lg px-2">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={e => { e.stopPropagation(); setCurrent(i); }}
            className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 transition-all ${
              i === current ? 'border-accent' : 'border-transparent opacity-50'
            }`}
          >
            <img src={img.src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </motion.div>
  );
};

/* ── Single Image Card ── */
const ImageCard = ({ image, index, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: (index % 6) * 0.07 }}
    onClick={onClick}
    className="relative group cursor-pointer rounded-xl overflow-hidden aspect-[4/3] bg-gray-200 shadow-md hover:shadow-xl transition-shadow"
  >
    <img
      src={image.src}
      alt={image.location}
      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
      style={{ '--tw-scale-x': 1, '--tw-scale-y': 1 }}
    />

    {/* Caption overlay — slides up on hover */}
    <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-3 px-4">
      <p className="text-white text-xs sm:text-sm font-medium flex items-center gap-1.5">
        <span className="text-accent">📍</span>
        {image.location}
      </p>
    </div>

    {/* Always-visible subtle bottom bar on mobile */}
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent pt-6 pb-2 px-3 sm:hidden">
      <p className="text-white text-xs font-medium flex items-center gap-1">
        <span>📍</span>{image.location}
      </p>
    </div>

    {/* Zoom icon */}
    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="bg-black/50 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">
        ⊕
      </div>
    </div>
  </motion.div>
);

/* ── Main exported component ── */
const ResidenceGallery = ({ images, category, galleryPath }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? images : images.slice(0, PREVIEW_LIMIT);
  const hasMore = images.length > PREVIEW_LIMIT;

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        {displayed.map((img, i) => (
          <ImageCard
            key={img.id}
            image={img}
            index={i}
            onClick={() => setLightboxIndex(i)}
          />
        ))}
      </div>

      {/* View More / Collapse */}
      {hasMore && (
        <div className="text-center mt-8 sm:mt-10">
          {!showAll ? (
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 border-2 border-accent text-accent px-7 sm:px-8 py-3 sm:py-3.5 rounded-luxury hover:bg-accent hover:text-white transition-all font-medium text-sm sm:text-base"
            >
              <span>🖼</span>
              Explore Full Gallery
              <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full ml-1">
                +{images.length - PREVIEW_LIMIT}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowAll(false)}
              className="inline-flex items-center gap-2 border-2 border-gray-300 text-textGrey px-7 sm:px-8 py-3 sm:py-3.5 rounded-luxury hover:border-accent hover:text-accent transition-all font-medium text-sm sm:text-base"
            >
              Show Less ↑
            </button>
          )}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={displayed}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ResidenceGallery;
