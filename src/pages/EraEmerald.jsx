import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import {
  FaBolt,
  FaBook,
  FaCar,
  FaCheck,
  FaChargingStation,
  FaChevronLeft,
  FaChevronRight,
  FaChild,
  FaCube,
  FaDownload,
  FaDroplet,
  FaDumbbell,
  FaLandmark,
  FaLeaf,
  FaLightbulb,
  FaLocationDot,
  FaMagnifyingGlass,
  FaMagnifyingGlassPlus,
  FaMapLocationDot,
  FaPersonWalking,
  FaRoad,
  FaRulerCombined,
  FaShieldHalved,
  FaShoePrints,
  FaStar,
  FaSun,
  FaTemperatureHalf,
  FaTree,
  FaTrowelBricks,
  FaUsers,
  FaVideo,
  FaXmark,
} from 'react-icons/fa6';
import { CONTACT_DETAILS } from '../data/contactDetails';
import ContactPopup from '../components/ContactPopup';
import { getPublicVillaByIdentifier } from '../services/api';

const emptyProject = {
  id: '',
  slug: '',
  name: '',
  location: '',
  status: '',
  description: '',
  overviewTitle: '',
  overviewDescription: '',
  acres: '',
  totalVillas: '',
  configuration: '',
  price: '',
  bannerImage: '',
  brochurePdfUrl: '',
  walkthroughVideoUrl: '',
  availabilityChartPdfUrl: '',
  mapLocationUrl: '',
  rera: '',
  otherCharges: '',
  projectDetails: {},
  images: { exterior: [], interior: [] },
  highlights: [],
  amenities: [],
  locationAdvantages: [],
};

/* ── helpers ── */
const SH = ({ label, title, light = false, left = false }) => (
  <div className={`mb-10 sm:mb-14 ${left ? '' : 'text-center'}`}>
    {label && <span className="text-accent text-xs font-semibold tracking-widest uppercase mb-3 block">{label}</span>}
    <h2 className={`font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold ${light ? 'text-white' : 'text-primary'}`}>{title}</h2>
    <div className={`w-14 h-0.5 bg-accent mt-4 ${left ? '' : 'mx-auto'}`} />
  </div>
);

function mergeVillaProject(baseProject, nextProject) {
  const mergedProject = {
    ...baseProject,
    ...nextProject,
  };

  mergedProject.images = {
    exterior: Array.isArray(nextProject?.images?.exterior) && nextProject.images.exterior.length > 0 ? nextProject.images.exterior : baseProject.images.exterior,
    interior: Array.isArray(nextProject?.images?.interior) && nextProject.images.interior.length > 0 ? nextProject.images.interior : baseProject.images.interior,
  };
  mergedProject.highlights = Array.isArray(nextProject?.highlights) && nextProject.highlights.length > 0 ? nextProject.highlights : baseProject.highlights;
  mergedProject.amenities = Array.isArray(nextProject?.amenities) && nextProject.amenities.length > 0 ? nextProject.amenities : baseProject.amenities;
  mergedProject.locationAdvantages = Array.isArray(nextProject?.locationAdvantages) && nextProject.locationAdvantages.length > 0 ? nextProject.locationAdvantages : baseProject.locationAdvantages;
  mergedProject.name = nextProject?.name || baseProject.name || '';
  mergedProject.location = nextProject?.location || baseProject.location || '';
  mergedProject.price = nextProject?.price || nextProject?.startingPrice || baseProject.price || '';
  mergedProject.rera = nextProject?.rera || nextProject?.reraNumber || baseProject.rera || '';
  mergedProject.otherCharges = nextProject?.otherCharges || baseProject.otherCharges || '';

  return mergedProject;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function getHeroImage(project) {
  return project?.bannerImage || project?.image || project?.images?.exterior?.[0] || '';
}

function getExteriorGalleryImages(project) {
  const exteriorImages = Array.isArray(project?.images?.exterior) ? project.images.exterior.filter(Boolean) : [];
  const bannerCandidates = [project?.bannerImage, project?.image].filter(Boolean);

  return exteriorImages.filter((imageUrl) => !bannerCandidates.includes(imageUrl));
}

function getInteriorGalleryImages(project) {
  return Array.isArray(project?.images?.interior) ? project.images.interior.filter(Boolean) : [];
}

function VillaNotFoundState() {
  return (
    <div className="min-h-screen bg-bgLight flex items-center justify-center px-4 py-24">
      <div className="max-w-xl w-full rounded-[32px] bg-white border border-gray-200 shadow-[0_20px_60px_rgba(15,23,42,0.08)] p-8 sm:p-10 text-center">
        <span className="inline-flex items-center rounded-full bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Villa not found
        </span>
        <h1 className="mt-6 font-serif text-3xl sm:text-4xl font-bold text-primary">Villa not found</h1>
        <p className="mt-4 text-sm sm:text-base text-textGrey leading-relaxed">
          The villa slug or id you opened does not exist anymore.
        </p>
        <div className="mt-8">
          <Link
            to="/villa-projects"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-opacity-90"
          >
            View Villa Projects
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Exterior Slider ── */
const ExteriorSlider = ({ project }) => {
  const [cur, setCur] = useState(0);
  const imgs = project?.images?.exterior || [];
  useEffect(() => {
    if (imgs.length <= 1) {
      return undefined;
    }

    const t = setInterval(() => setCur(p => (p + 1) % imgs.length), 4500);
    return () => clearInterval(t);
  }, [imgs.length]);
  return (
    <div className="relative w-full aspect-[16/7] min-h-[240px] max-h-[640px] overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.img key={cur} src={imgs[cur]} alt={`Exterior ${cur + 1}`}
          initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }} className="absolute inset-0 w-full h-full object-cover" />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <button onClick={() => setCur(p => (p - 1 + imgs.length) % imgs.length)}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-accent text-white w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl transition-colors z-10"><FaChevronLeft /></button>
      <button onClick={() => setCur(p => (p + 1) % imgs.length)}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-accent text-white w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl transition-colors z-10"><FaChevronRight /></button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {imgs.map((_, i) => (
          <button key={i} onClick={() => setCur(i)}
            className={`rounded-full transition-all ${i === cur ? 'bg-accent w-7 h-2' : 'bg-white/60 w-2 h-2'}`} />
        ))}
      </div>
      <div className="absolute bottom-4 right-4 sm:right-6 bg-black/50 text-white text-xs px-3 py-1 rounded-full z-10">
        {cur + 1} / {imgs.length}
      </div>
    </div>
  );
};

/* ── Interior Gallery + Lightbox ── */
const InteriorGallery = ({ project }) => {
  const [lb, setLb] = useState(null);
  const imgs = project?.images?.interior || [];
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        {imgs.map((src, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ delay: i * 0.07 }}
            onClick={() => setLb(i)}
            className="relative overflow-hidden rounded-lg sm:rounded-xl cursor-pointer group aspect-[4/3]">
            <img src={src} alt={`Interior ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
              <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity"><FaMagnifyingGlassPlus /></span>
            </div>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {lb !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/96 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setLb(null)}>
            <button className="absolute top-4 right-4 text-white/70 hover:text-accent text-3xl z-10" onClick={() => setLb(null)}><FaXmark /></button>
            <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm">{lb + 1} / {imgs.length}</p>
            <button className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-accent text-white w-10 h-10 sm:w-12 sm:h-12 roNunded-full flex items-center justify-center text-xl transition-colors z-10"
              onClick={e => { e.stopPropagation(); setLb(p => (p - 1 + imgs.length) % imgs.length); }}><FaChevronLeft /></button>
            <motion.img key={lb} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              src={imgs[lb]} alt="Interior" className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
              onClick={e => e.stopPropagation()} />
            <button className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-accent text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl transition-colors z-10"
              onClick={e => { e.stopPropagation(); setLb(p => (p + 1) % imgs.length); }}><FaChevronRight /></button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {imgs.map((s, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setLb(i); }}
                  className={`flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === lb ? 'border-accent' : 'border-transparent opacity-40'}`}>
                  <img src={s} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ── Availability Preview ── */
const AvailabilityPreview = ({ pdfUrl }) => (
  <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
    {pdfUrl ? (
      <iframe
        src={pdfUrl}
        title="Availability chart preview"
        className="h-[80vh] w-full bg-white"
      />
    ) : (
      <div className="flex min-h-[340px] items-center justify-center bg-bgLight px-6 py-10 text-center text-textGrey">
        <div>
          <p className="text-base font-semibold text-primary">Availability chart not available</p>
        </div>
      </div>
    )}
  </div>
);

const amenityIconMap = {
  solar: FaSun,
  fitness: FaDumbbell,
  lounge: FaUsers,
  jogging: FaPersonWalking,
  children: FaChild,
  recreation: FaTree,
  landscape: FaLeaf,
  gathering: FaUsers,
  pathway: FaShoePrints,
  parking: FaCar,
  security: FaShieldHalved,
  cctv: FaVideo,
  compound: FaCube,
  roads: FaRoad,
  lighting: FaLightbulb,
  ev: FaChargingStation,
  library: FaBook,
};

const engineeringItems = [
  { icon: FaTrowelBricks, title: 'RCC Frame Structure', desc: 'Reinforced concrete construction for maximum strength and durability.' },
  { icon: FaCube, title: 'Premium Materials', desc: 'Only certified, high-grade materials sourced from trusted suppliers.' },
  { icon: FaRulerCombined, title: 'Precision Engineering', desc: 'Every dimension planned and executed with engineering accuracy.' },
  { icon: FaMagnifyingGlass, title: 'Quality Inspections', desc: 'Multi-stage quality checks at every phase of construction.' },
  { icon: FaDroplet, title: 'Waterproofing', desc: 'Advanced waterproofing systems for roofs, bathrooms, and basements.' },
  { icon: FaBolt, title: 'Electrical Systems', desc: 'Concealed wiring with branded fittings and safety-compliant installations.' },
  { icon: FaTemperatureHalf, title: 'Thermal Comfort', desc: 'Designed for natural ventilation and optimal thermal performance.' },
  { icon: FaShieldHalved, title: 'Seismic Compliance', desc: 'Structures designed to meet seismic zone safety requirements.' },
];

const qrItems = [
  { label: 'Scan for Location', icon: FaLocationDot, sub: 'Google Maps' },
  { label: 'Scan for RERA', icon: FaLandmark, sub: 'RERA Portal' },
];

/* ── Main Page ── */
const EraEmerald = () => {
  const { villaSlug } = useParams();
  const [project, setProject] = useState(emptyProject);
  const [loadError, setLoadError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const heroImage = getHeroImage(project);
  const exteriorImages = getExteriorGalleryImages(project);
  const interiorImages = getInteriorGalleryImages(project);
  const highlights = Array.isArray(project.highlights) ? project.highlights.filter((item) => Boolean(normalizeText(item))) : [];
  const amenities = Array.isArray(project.amenities)
    ? project.amenities.filter((item) => Boolean(normalizeText(item?.title) || normalizeText(item?.desc) || normalizeText(item?.icon)))
    : [];
  const locationAdvantages = Array.isArray(project.locationAdvantages)
    ? project.locationAdvantages.filter((item) => Boolean(normalizeText(item)))
    : [];
  const showAvailabilityChart = Boolean(normalizeText(project.availabilityChartPdfUrl));
  const showLocationLegal = Boolean(
    normalizeText(project.mapLocationUrl)
    || normalizeText(project.rera)
    || normalizeText(project.otherCharges)
    || locationAdvantages.length > 0,
  );
  const isVillaNotFound = /villa not found/i.test(loadError);

  const wa = `https://wa.me/${CONTACT_DETAILS.whatsappNumber}?text=${encodeURIComponent(`Hi! I am interested in ${project.name || ''}.`)}`;

  useEffect(() => {
    let isMounted = true;

    async function loadVilla() {
      const identifier = String(villaSlug || '').trim();

      if (!identifier) {
        if (isMounted) {
          setProject(emptyProject);
          setLoadError('');
        }
        return;
      }

      try {
        const data = await getPublicVillaByIdentifier(identifier);

        if (!isMounted) {
          return;
        }

        setProject(mergeVillaProject(emptyProject, data.villa || data.project || data));
        setLoadError('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setProject(emptyProject);
        setLoadError(error.message || '');
      }
    }

    loadVilla();

    return () => {
      isMounted = false;
    };
  }, [villaSlug]);

  useEffect(() => {
    const timer = setTimeout(() => setShowPopup(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (isVillaNotFound) {
    return <VillaNotFoundState />;
  }

  return (
    <div className="overflow-x-hidden">
      {showPopup && <ContactPopup onClose={() => setShowPopup(false)} />}

      {/* 1 ── HERO */}
      <section className="relative min-h-[75vh] sm:min-h-screen flex items-end pb-16 sm:pb-24">
        <div
          className="absolute inset-0 bg-cover bg-center bg-primary"
          style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/50 to-black/20" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-32">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="max-w-3xl">
            {project.status ? (
              <span className="inline-block bg-accent text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
                {project.status === 'completed' ? 'Completed Project' : project.status === 'draft' ? 'Draft Project' : 'Ongoing Project'}
              </span>
            ) : null}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 leading-tight">{project.name}</h1>
            <p className="text-accent font-medium text-base sm:text-lg mb-3 flex items-center gap-2"><FaLocationDot /> {project.location}</p>
            {loadError ? <p className="mb-3 text-sm text-amber-300">{loadError}</p> : null}
            <p className="text-gray-200 text-base sm:text-lg md:text-xl mb-8 max-w-2xl leading-relaxed">{project.description}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/contact" className="inline-block bg-accent text-white px-7 py-3.5 rounded-luxury hover:bg-opacity-90 transition-all font-medium text-center text-sm sm:text-base">Book a Site Visit</Link>
              {normalizeText(project.brochurePdfUrl) ? (
                <a href={project.brochurePdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-7 py-3.5 rounded-luxury hover:bg-white hover:text-primary transition-all font-medium text-sm sm:text-base">
                  <FaDownload /> Download Brochure
                </a>
              ) : null}
            </div>
          </motion.div>
        </div>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 flex flex-col items-center text-xs">
          <span className="mb-1">Scroll</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </motion.div>
      </section>

      {/* 2 ── OVERVIEW */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <SH label={project.overviewTitle ? 'Project Overview' : ''} title={project.overviewTitle || ''} left />
              <div className="space-y-4 text-textGrey text-sm sm:text-base leading-relaxed">
                <p>{project.overviewDescription || project.description || ''}</p>
                <p>{project.description || ''}</p>
                <p>{project.name ? `${project.name} is more than just a collection of homes — it is a refined living experience where comfort, privacy, and long-term value come together for modern families.` : ''}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="grid grid-cols-2 gap-3 sm:gap-4">
              {[[project.acres || project.overviewTotalLand || '', 'Total Land'], [project.totalVillas || project.overviewTotalUnits || '', 'Total Units'], [project.configuration || '', 'Configuration'], [project.price || '', 'Starting Price']].map(([v, l], i) => (
                <div key={i} className="bg-bgLight rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center border border-gray-100 hover:border-accent/30 transition-colors">
                  <div className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-accent mb-1">{v}</div>
                  <div className="text-textGrey text-xs sm:text-sm">{l}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3 ── EXTERIOR GALLERY */}
      {exteriorImages.length > 0 ? (
        <section>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            <SH label="Gallery" title="Exterior Views" />
          </div>
          <ExteriorSlider project={{ ...project, images: { ...project.images, exterior: exteriorImages } }} />
        </section>
      ) : null}

      {/* 4 ── INTERIOR GALLERY */}
      {interiorImages.length > 0 ? (
        <section className="py-16 sm:py-20 bg-bgLight">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SH label="Inside Your Home" title="Interior Spaces" />
            <InteriorGallery project={{ ...project, images: { ...project.images, interior: interiorImages } }} />
          </div>
        </section>
      ) : null}

      {/* 5 ── VIDEO */}
      {normalizeText(project.walkthroughVideoUrl) ? (
        <section className="py-16 sm:py-20 bg-primary">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SH label="Walkthrough" title={`Experience ${project.name}`} light />
            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={project.images.exterior[1] || project.images.exterior[0] || heroImage || ''}
                  className="h-full w-full object-cover"
                >
                  <source src={project.walkthroughVideoUrl} />
                </video>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 6 ── PROJECT HIGHLIGHTS */}
      {highlights.length > 0 ? (
        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SH label="Why This Villa" title="Project Highlights" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
              {highlights.map((highlight, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}
                  className="flex items-start gap-3 bg-bgLight rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow">
                  <FaStar className="text-accent text-sm mt-1.5 flex-shrink-0" />
                  <span className="text-primary font-medium text-sm sm:text-base">{highlight}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 7 ── PROJECT DETAILS TABLE */}
      <section className="py-16 sm:py-20 bg-bgLight">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SH label="Specifications" title="Project Details" />
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            {[
              ['Project Name', project.projectDetails?.projectName || project.name || ''], ['Location', project.projectDetails?.location || project.location || ''],
              ['Total Land Area', project.projectDetails?.totalLandArea || project.acres || project.overviewTotalLand || ''], ['Total Units', project.projectDetails?.totalUnits || project.totalVillas || project.overviewTotalUnits || ''],
              ['Configuration', project.projectDetails?.configuration || project.configuration || ''], ['Price', project.projectDetails?.price || project.price || ''],
              ['Status', project.projectDetails?.status || project.status || ''], ['RERA Number', project.projectDetails?.reraNumber || project.rera || ''],
            ].map(([k, v], i) => (
              <div key={i} className={`flex flex-col sm:flex-row sm:items-center px-5 sm:px-8 py-4 sm:py-5 ${i % 2 === 0 ? 'bg-white' : 'bg-bgLight'}`}>
                <span className="text-textGrey text-xs font-medium w-full sm:w-52 mb-1 sm:mb-0 uppercase tracking-wide">{k}</span>
                <span className="text-primary font-semibold text-sm sm:text-base">{v}</span>
              </div>
            ))}
            <div className="px-5 sm:px-8 py-4 sm:py-5 bg-white border-t border-gray-100">
              <span className="text-textGrey text-xs font-medium uppercase tracking-wide block mb-1">Other Charges</span>
              <span className="text-textGrey text-xs sm:text-sm leading-relaxed">{project.otherCharges}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8 ── AMENITIES */}
      {amenities.length > 0 ? (
        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SH label="Lifestyle Features" title="Amenities & Features" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {amenities.map((amenity, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (index % 6) * 0.07 }}
                  className="flex gap-4 bg-bgLight rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-md transition-shadow group">
                  {(() => {
                    const AmenityIcon = amenityIconMap[amenity.icon] || FaCheck;
                    return <AmenityIcon className="text-2xl sm:text-3xl text-accent flex-shrink-0 group-hover:scale-110 transition-transform" />;
                  })()}
                  <div>
                    <h4 className="font-semibold text-primary text-sm sm:text-base mb-1">{amenity.title}</h4>
                    <p className="text-textGrey text-xs sm:text-sm leading-relaxed">{amenity.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 9 ── ENGINEERING & QUALITY */}
      <section className="py-16 sm:py-20 bg-primary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SH label="Built to Last" title="Engineering & Quality" light />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {engineeringItems.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.08 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:bg-white/15 transition-colors group">
                <item.icon className="text-3xl mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-white text-sm sm:text-base mb-2">{item.title}</h4>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 10 ── AVAILABILITY CHART */}
      {showAvailabilityChart ? (
        <section className="py-16 sm:py-20 bg-bgLight">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SH label="Unit Status" title="Availability Chart" />
            <AvailabilityPreview pdfUrl={project.availabilityChartPdfUrl} />
            <div className="text-center mt-8">
              <a href={project.availabilityChartPdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-accent text-white px-8 py-3.5 rounded-luxury hover:bg-opacity-90 transition-all font-medium text-sm sm:text-base shadow-lg">
                <FaDownload /> Download Full Availability Chart
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {/* 11 ── LOCATION & LEGAL */}
      {showLocationLegal ? (
        <section className="py-16 sm:py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <SH label="Find Us" title="Location & Legal" />
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
              <div className="lg:col-span-3">
                <div className="rounded-2xl overflow-hidden shadow-xl bg-gray-100 h-64 sm:h-80 lg:h-full min-h-[300px] flex items-center justify-center border border-gray-200">
                  <div className="text-center text-textGrey p-6">
                    <FaMapLocationDot className="text-5xl mb-3 mx-auto text-accent" />
                    <p className="font-semibold text-primary text-base mb-1">Google Map</p>
                    <p className="text-sm text-textGrey">{project.location || ''}</p>
                    {normalizeText(project.mapLocationUrl) ? (
                      <a href={project.mapLocationUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-4 bg-accent text-white px-5 py-2 rounded-luxury text-sm hover:bg-opacity-90 transition-all">
                        Open in Maps
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-5">
                {qrItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {qrItems.map((qr, i) => (
                      <div key={i} className="bg-bgLight rounded-xl p-4 text-center border border-gray-100 hover:border-accent/30 transition-colors">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl mx-auto mb-3 flex items-center justify-center text-3xl shadow-sm border border-gray-100"><qr.icon className="text-accent" /></div>
                        <p className="text-xs font-semibold text-primary">{qr.label}</p>
                        <p className="text-xs text-textGrey mt-0.5">{qr.sub}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {normalizeText(project.rera) ? (
                  <div className="bg-bgLight rounded-xl p-4 sm:p-5 border border-gray-100">
                    <p className="text-xs text-textGrey uppercase tracking-wide mb-1">RERA Registration</p>
                    <p className="text-primary font-semibold text-sm sm:text-base">{project.rera || ''}</p>
                  </div>
                ) : null}
                {locationAdvantages.length > 0 ? (
                  <div className="bg-bgLight rounded-xl p-4 sm:p-5 border border-gray-100">
                    <h4 className="font-serif text-base sm:text-lg font-bold text-primary mb-4">Location Advantages</h4>
                    <ul className="space-y-2.5">
                      {locationAdvantages.map((advantage, i) => (
                        <li key={i} className="flex items-center gap-3 text-textGrey text-sm">
                          <span className="w-5 h-5 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xs flex-shrink-0"><FaCheck /></span>
                          {advantage}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 12 ── FINAL CTA */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: project.images.exterior[2] || project.images.exterior[1] || project.images.exterior[0] ? `url(${project.images.exterior[2] || project.images.exterior[1] || project.images.exterior[0]})` : 'none' }}>
          <div className="absolute inset-0 bg-primary/90" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <span className="text-accent text-xs font-semibold tracking-widest uppercase mb-4 block">Limited Units Available</span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">Own Your Dream Villa at {project.name}</h2>
            <p className="text-gray-300 text-base sm:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto">
              Limited units available in this premium gated community. Secure your home today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/contact" className="bg-accent text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-luxury hover:bg-opacity-90 transition-all font-medium text-sm sm:text-base">Book a Site Visit</Link>
              <Link to="/contact" className="border-2 border-white text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-luxury hover:bg-white hover:text-primary transition-all font-medium text-sm sm:text-base">Get Full Details</Link>
              <a href={wa} target="_blank" rel="noopener noreferrer"
                className="bg-green-500 text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-luxury hover:bg-green-600 transition-all font-medium flex items-center justify-center gap-2 text-sm sm:text-base">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                WhatsApp Now
              </a>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default EraEmerald;
