import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FaBuildingColumns,
  FaChartLine,
  FaCreditCard,
  FaCube,
  FaGem,
  FaScrewdriverWrench,
} from 'react-icons/fa6';
import ResidenceGallery from '../components/ResidenceGallery';
import { residenceImages } from '../data/residencesData';

/* ── Section heading helper ── */
const SectionHeading = ({ label, title, center = true }) => (
  <div className={`mb-10 sm:mb-12 ${center ? 'text-center' : ''}`}>
    {label && (
      <span className="text-accent text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3 block">
        {label}
      </span>
    )}
    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary">
      {title}
    </h2>
    <div className={`w-14 h-0.5 bg-accent mt-4 ${center ? 'mx-auto' : ''}`} />
  </div>
);

const features = [
  { icon: FaBuildingColumns, title: 'Vastu-Compliant Designs', desc: 'Traditional wisdom meets modern architecture for harmony and positive energy.' },
  { icon: FaCube, title: '3D Architectural Walkthroughs', desc: 'Visualize your dream home in full detail before a single brick is laid.' },
  { icon: FaGem, title: 'Premium Material Sourcing', desc: 'Complete transparency in material selection — you know exactly what goes into your home.' },
  { icon: FaChartLine, title: 'Weekly Progress Reports', desc: 'Stay updated with detailed reports and photos, especially for NRI clients.' },
  { icon: FaCreditCard, title: 'Stage-wise Payment Flexibility', desc: 'Convenient payment plans aligned to construction milestones.' },
  { icon: FaScrewdriverWrench, title: 'Concept-to-Key Service', desc: 'End-to-end project management from design to final handover.' },
];

const processSteps = [
  { step: '01', title: 'Consultation', desc: 'Discuss your vision and requirements with our team.' },
  { step: '02', title: 'Design', desc: 'Architectural planning and 3D visualization.' },
  { step: '03', title: 'Approval', desc: 'Legal clearances and documentation.' },
  { step: '04', title: 'Construction', desc: 'Quality execution with regular progress updates.' },
  { step: '05', title: 'Handover', desc: 'Final inspection and key delivery.' },
];

const IndependentResidences = () => {
  const [activeGallery, setActiveGallery] = useState('ongoing');

  const activeImages = residenceImages[activeGallery];

  return (
    <div className="pt-20 sm:pt-24">

    {/* ── HERO ── */}
    <section className="relative py-24 sm:py-32 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=80)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/92 to-primary/70" />
      </div>
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Your Signature Home, Built by Experts
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Era Creatio offers a Concept-to-Key service where our architects and engineers collaborate
            with you to design and build a home that is uniquely yours.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-accent text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-luxury hover:bg-opacity-90 transition-all font-medium text-sm sm:text-base"
          >
            Start Your Journey
          </Link>
        </motion.div>
      </div>
    </section>

    {/* ── FEATURES ── */}
    <section className="py-14 sm:py-20 bg-bgLight">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="What We Offer" title="Bespoke Features" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all group"
            >
              <f.icon className="text-3xl sm:text-4xl mb-4 text-accent group-hover:scale-110 transition-transform" />
              <h3 className="font-serif text-lg sm:text-xl font-bold text-primary mb-2">{f.title}</h3>
              <p className="text-textGrey text-sm sm:text-base leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* ── PROCESS TIMELINE ── */}
    <section className="py-14 sm:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="How It Works" title="Our Process" />
        <div className="relative">
          {/* connecting line — desktop only */}
          <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-accent/20" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
            {processSteps.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                <div className="bg-accent text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 font-serif text-lg sm:text-xl font-bold relative z-10 shadow-lg">
                  {item.step}
                </div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-primary mb-1">{item.title}</h3>
                <p className="text-textGrey text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ── PROJECTS GALLERY (TOGGLED) ── */}
    <section className="py-14 sm:py-20 bg-bgLight">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label="Our Works" title="Project Gallery" />

        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="inline-flex bg-white rounded-luxury p-1.5 shadow-md">
            <button
              onClick={() => setActiveGallery('ongoing')}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-luxury text-xs sm:text-sm font-semibold tracking-wide transition-all ${
                activeGallery === 'ongoing'
                  ? 'bg-accent text-white shadow'
                  : 'text-textGrey hover:text-primary'
              }`}
            >
              Ongoing  
            </button>
            <button
              onClick={() => setActiveGallery('completed')}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-luxury text-xs sm:text-sm font-semibold tracking-wide transition-all ${
                activeGallery === 'completed'
                  ? 'bg-accent text-white shadow'
                  : 'text-textGrey hover:text-primary'
              }`}
            >
              Completed  
            </button>
          </div>
        </div>

        <ResidenceGallery
          images={activeImages}
          category={activeGallery}
          showExpandControls={false}
          viewGalleryPath="/independent-residences/gallery"
          viewGalleryLabel="View Gallery"
        />
      </div>
    </section>

    {/* ── INQUIRY CTA ── */}
    <section className="py-14 sm:py-20 bg-primary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready to Build Your Dream Home?
          </h2>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Let's discuss your vision and create a home that's uniquely yours.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-accent text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-luxury hover:bg-opacity-90 transition-all font-medium text-sm sm:text-base"
          >
            Schedule a Consultation
          </Link>
        </motion.div>
      </div>
    </section>

    </div>
  );
};

export default IndependentResidences;
