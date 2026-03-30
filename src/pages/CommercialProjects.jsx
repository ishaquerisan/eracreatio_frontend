import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FaLandmark,
  FaLeaf,
  FaLocationDot,
  FaMapLocationDot,
  FaRulerCombined,
  FaShieldHalved,
  FaTrowelBricks,
  FaXmark,
} from 'react-icons/fa6';
import { commercialProjects as staticCommercialProjects, commercialGallery } from '../data/projectsData';
import ResidenceGallery from '../components/ResidenceGallery';
import { getPublicCommercialProjects, getPublicGalleries } from '../services/api';

const highlights = [
  { icon: FaMapLocationDot, title: 'Strategic Project Planning', desc: 'Every project is planned with a focus on accessibility, site efficiency, and long-term usability.' },
  { icon: FaTrowelBricks, title: 'Structural Strength & Durability', desc: 'Designed and executed with engineering precision to ensure safety, stability, and long service life.' },
  { icon: FaRulerCombined, title: 'Functional Space Design', desc: 'Optimized layouts that enhance usability, movement, and operational efficiency.' },
  { icon: FaShieldHalved, title: 'Compliant Safety Systems', desc: 'Designed in accordance with fire and safety regulations for secure and reliable usage.' },
  { icon: FaLandmark, title: 'Modern Architectural Design', desc: 'Contemporary designs that balance aesthetics with practicality and performance.' },
  { icon: FaLeaf, title: 'Efficient & Sustainable Construction', desc: 'Focus on cost-effective, energy-conscious, and environmentally responsible building practices.' },
];

const SH = ({ label, title, light = false }) => (
  <div className="text-center mb-10 sm:mb-14">
    {label && <span className="text-accent text-xs font-semibold tracking-widest uppercase mb-3 block">{label}</span>}
    <h2 className={`font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold ${light ? 'text-white' : 'text-primary'}`}>{title}</h2>
    <div className={`w-14 h-0.5 bg-accent mt-4 mx-auto`} />
  </div>
);

const CommercialProjects = () => {
  const [activeTab, setActiveTab] = useState('ongoing');
  const [galleryTab, setGalleryTab] = useState('ongoing');
  const [projectCollections, setProjectCollections] = useState(staticCommercialProjects);
  const [galleryCollections, setGalleryCollections] = useState(commercialGallery);
  const [selectedProject, setSelectedProject] = useState(null);
  const projects = projectCollections[activeTab] || [];
  const activeGalleryImages = galleryCollections[galleryTab] || [];

  useEffect(() => {
    let isMounted = true;

    async function loadCommercialContent() {
      const [galleryResult, projectResult] = await Promise.allSettled([
        getPublicGalleries(),
        getPublicCommercialProjects(),
      ]);

      if (!isMounted) {
        return;
      }

      if (galleryResult.status === 'fulfilled') {
        const galleryData = galleryResult.value;
        setGalleryCollections({
          ongoing: Array.isArray(galleryData.commercial?.ongoing) ? galleryData.commercial.ongoing : [],
          completed: Array.isArray(galleryData.commercial?.completed) ? galleryData.commercial.completed : [],
        });
      } else {
        setGalleryCollections(commercialGallery);
      }

      if (projectResult.status === 'fulfilled') {
        const projectData = projectResult.value;
        setProjectCollections({
          ongoing: Array.isArray(projectData.ongoing) ? projectData.ongoing : [],
          completed: Array.isArray(projectData.completed) ? projectData.completed : [],
        });
      } else {
        setProjectCollections(staticCommercialProjects);
      }
    }

    loadCommercialContent();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSelectedProject(null);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedProject]);

  return (
    <div className="pt-20 sm:pt-24">

      {/* ── HERO ── */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/75" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <span className="inline-block bg-accent text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">Our Portfolio</span>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              Architectural Landmarks for Business Growth
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed mb-8">
              We develop high-quality commercial and institutional spaces, along with other non-residential projects, designed for functionality, durability, and long-term value.
            </p>
            <Link to="/contact"
              className="inline-block bg-accent text-white px-7 py-3.5 rounded-luxury hover:bg-opacity-90 transition-all font-medium text-sm sm:text-base">
              Discuss Your Project
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── OUR APPROACH ── */}
      <section className="py-14 sm:py-20 bg-bgLight">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SH label="How We Build" title="Our Approach" />
          <p className="text-textGrey text-sm sm:text-base lg:text-lg max-w-2xl mx-auto text-center -mt-6 mb-10 sm:mb-14">
            Every commercial project we undertake is built on a foundation of precision, compliance, and purposeful design.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {highlights.map((h, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl transition-all group">
                <h.icon className="text-3xl sm:text-4xl mb-4 text-accent group-hover:scale-110 transition-transform" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-primary mb-2">{h.title}</h3>
                <p className="text-textGrey text-sm sm:text-base leading-relaxed">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROJECTS WITH TABS ── */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SH label="Portfolio" title="Our Commercial Developments" />
          <div className="flex justify-center space-x-3 sm:space-x-4 mb-10 sm:mb-12">
            {['ongoing', 'completed'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-luxury font-medium capitalize transition-all text-sm sm:text-base ${
                  activeTab === tab ? 'bg-accent text-white shadow-md' : 'bg-bgLight text-primary hover:bg-gray-100'
                }`}>
                {tab === 'ongoing' ? 'Ongoing Projects' : 'Completed Projects'}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {projects.map((project, index) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                <div className="relative h-52 sm:h-64 overflow-hidden">
                  <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${project.status === 'Ongoing' ? 'bg-accent text-white' : 'bg-green-500 text-white'}`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary mb-1">{project.name}</h3>
                  <p className="text-textGrey text-sm sm:text-base mb-3 flex items-center gap-1.5"><FaLocationDot className="text-accent" />{project.location}</p>
                  <div className="flex justify-between text-xs sm:text-sm text-textGrey mb-4">
                    <span><strong className="text-primary">{project.landArea}</strong> Land</span>
                    <span><strong className="text-primary">{project.units}</strong></span>
                  </div>
                  {project.summary ? (
                    <p className="text-xs sm:text-sm text-textGrey mb-4 line-clamp-2">{project.summary}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSelectedProject(project)}
                    className="block w-full text-center bg-primary text-white py-2.5 sm:py-3 rounded-luxury hover:bg-accent transition-colors font-medium text-sm sm:text-base"
                  >
                    View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          {!projects.length ? <p className="text-center text-textGrey text-sm sm:text-base mt-6">No commercial projects available in this category yet.</p> : null}
        </div>
      </section>

      {selectedProject ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 sm:p-6 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center">
            <div className="w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl">
              <div className="relative h-56 sm:h-72">
                <img
                  src={selectedProject.image}
                  alt={selectedProject.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black/75 text-white rounded-full w-9 h-9 inline-flex items-center justify-center"
                  aria-label="Close details"
                >
                  <FaXmark />
                </button>
                <div className="absolute left-4 right-4 bottom-4 text-white">
                  <p className="text-xs uppercase tracking-wide text-gray-200">{selectedProject.status || (selectedProject.category === 'completed' ? 'Completed' : 'Ongoing')}</p>
                  <h3 className="font-serif text-2xl sm:text-3xl leading-tight">{selectedProject.name}</h3>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div className="bg-bgLight rounded-xl p-3">
                    <p className="text-textGrey">Location</p>
                    <p className="text-primary font-medium mt-1">{selectedProject.location || '-'}</p>
                  </div>
                  <div className="bg-bgLight rounded-xl p-3">
                    <p className="text-textGrey">Land Area</p>
                    <p className="text-primary font-medium mt-1">{selectedProject.landArea || '-'}</p>
                  </div>
                  <div className="bg-bgLight rounded-xl p-3">
                    <p className="text-textGrey">Units</p>
                    <p className="text-primary font-medium mt-1">{selectedProject.units || '-'}</p>
                  </div>
                </div>

                {selectedProject.summary ? (
                  <p className="mt-5 text-sm sm:text-base text-textGrey leading-relaxed">{selectedProject.summary}</p>
                ) : null}

                <div className="mt-4 bg-bgLight rounded-xl p-4">
                  <p className="text-primary font-medium mb-2">Project Details</p>
                  <p className="text-sm sm:text-base text-textGrey whitespace-pre-line leading-relaxed">
                    {selectedProject.details || 'Detailed project notes will be shared soon.'}
                  </p>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedProject(null)}
                    className="bg-primary text-white px-6 py-2.5 rounded-luxury hover:bg-accent transition-colors text-sm sm:text-base"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── PROJECT GALLERY ── */}
      <section className="py-14 sm:py-20 bg-bgLight">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SH label="Site Photography" title="Project Gallery" />
          <div className="flex justify-center space-x-3 sm:space-x-4 mb-10">
            {['ongoing', 'completed'].map(tab => (
              <button key={tab} onClick={() => setGalleryTab(tab)}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-luxury font-medium capitalize transition-all text-sm sm:text-base ${
                  galleryTab === tab ? 'bg-accent text-white shadow-md' : 'bg-white text-primary hover:bg-gray-100'
                }`}>
                {tab === 'ongoing' ? 'Ongoing' : 'Completed'}
              </button>
            ))}
          </div>
          <ResidenceGallery
            images={activeGalleryImages}
            category={galleryTab}
            showExpandControls={false}
            viewGalleryPath="/commercial-projects/gallery"
            viewGalleryLabel="View Gallery"
          />
        </div>
      </section>

      {/* ── STRONG CTA ── */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80)' }}>
          <div className="absolute inset-0 bg-primary/90" />
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <span className="text-accent text-xs font-semibold tracking-widest uppercase mb-4 block">Let's Build Together</span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
              Have a Commercial Project in Mind?
            </h2>
            <p className="text-gray-300 text-base sm:text-lg mb-8 sm:mb-10 max-w-2xl mx-auto">
              From institutional buildings to commercial complexes — we bring your vision to life with precision engineering and purposeful design.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/contact"
                className="bg-accent text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-luxury hover:bg-opacity-90 transition-all font-medium text-sm sm:text-base shadow-lg">
                Enquire Now
              </Link>
              <Link to="/contact"
                className="border-2 border-white text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-luxury hover:bg-white hover:text-primary transition-all font-medium text-sm sm:text-base">
                Discuss Your Project
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default CommercialProjects;
