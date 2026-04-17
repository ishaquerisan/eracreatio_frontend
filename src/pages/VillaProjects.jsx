import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaLocationDot } from 'react-icons/fa6';
import { getPublicVillas } from '../services/api';

function normalizeVillaCard(villa) {
  return {
    id: villa.id,
    slug: villa.slug,
    name: villa.name || 'Untitled Villa',
    location: villa.location || '-',
    status: String(villa.status || 'ongoing').toLowerCase(),
    landArea: villa.acres || villa.overviewTotalLand || '-',
    units: villa.totalVillas || villa.overviewTotalUnits || '-',
    image: villa.bannerImage || villa.image || villa.images?.exterior?.[0] || '',
    logo: villa.projectLogo || villa.logo || '',
  };
}

function splitVillasByTab(villas) {
  const liveVillas = Array.isArray(villas) ? villas : [];
  const ongoing = liveVillas.filter((villa) => villa.status === 'ongoing');
  const upcoming = liveVillas.filter((villa) => villa.status === 'upcoming');
  const completed = liveVillas.filter((villa) => villa.status === 'completed');

  return {
    ongoing,
    upcoming,
    completed: completed.length > 0 ? completed : [],
  };
}

function getStatusLabel(status) {
  if (status === 'ongoing') {
    return 'Ongoing';
  }

  if (status === 'upcoming') {
    return 'Upcoming';
  }

  if (status === 'completed') {
    return 'Completed';
  }

  return 'Live';
}

const VillaProjects = () => {
  const [activeTab, setActiveTab] = useState('ongoing');
  const [projectsByTab, setProjectsByTab] = useState({
    ongoing: [],
    upcoming: [],
    completed: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadVillas() {
      setIsLoading(true);

      try {
        const response = await getPublicVillas();
        const mappedProjects = (response.villas || []).map(normalizeVillaCard);

        if (isMounted) {
          setProjectsByTab(splitVillasByTab(mappedProjects));
        }
      } catch (_error) {
        if (isMounted) {
          setProjectsByTab(splitVillasByTab([]));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadVillas();

    return () => {
      isMounted = false;
    };
  }, []);

  const projects = projectsByTab[activeTab] || [];

  return (
    <div className="pt-20 sm:pt-24">
      {/* Popup removed — moved to Era Emerald page */}
      {/* Hero */}
      <section className="relative py-24 sm:py-32 bg-primary text-white text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">Life in a Gated Sanctuary</h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the perfect blend of privacy and community living. Our villa projects are designed with a focus on green spaces, security, and modern amenities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabs + Cards */}
      <section className="py-12 sm:py-16 bg-bgLight">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-10 sm:mb-12">
            {['ongoing', 'upcoming', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-luxury font-medium capitalize transition-all text-sm sm:text-base ${
                  activeTab === tab ? 'bg-accent text-white' : 'bg-white text-primary hover:bg-gray-100'
                }`}
              >
                {tab === 'ongoing' ? 'Ongoing' : tab === 'upcoming' ? 'Upcoming' : 'Completed'}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white rounded-[28px] overflow-hidden shadow-[0_14px_35px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)] transition-all duration-300"
              >
                <div className="relative h-56 sm:h-64 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {project.logo ? (
                    <div className="absolute left-3 top-3 rounded-2xl border border-white/60 bg-white/90 p-2 shadow-lg backdrop-blur-sm">
                      <img src={project.logo} alt={`${project.name} logo`} className="h-10 w-20 object-contain sm:h-12 sm:w-24" />
                    </div>
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm ${
                      project.status === 'upcoming' ? 'bg-white text-primary' : 'bg-[#CFA95F] text-white'
                    }`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                </div>
                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-6 sm:pb-7 space-y-4">
                  <div>
                    <h3 className="font-serif text-[26px] sm:text-[30px] leading-tight font-bold text-primary mb-1.5">{project.name}</h3>
                    <p className="text-[#6A6A6A] text-sm sm:text-[15px] flex items-center">
                      <FaLocationDot className="mr-2 text-accent shrink-0" />
                      <span>{project.location}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm pt-1">
                    <div>
                      <p className="text-[#111111] text-[15px] font-semibold leading-none">{project.landArea}</p>
                      <p className="mt-1 text-[#6A6A6A] text-sm">Land</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#111111] text-[15px] font-semibold leading-none">{project.units}</p>
                      <p className="mt-1 text-[#6A6A6A] text-sm">Villas</p>
                    </div>
                  </div>

                  {project.status === 'ongoing' || project.status === 'completed' ? (
                    <Link
                      to={`/villa/${project.slug || project.id}`}
                      className="block w-full text-center bg-[#121212] text-white py-3.5 rounded-full hover:bg-[#1f1f1f] transition-colors font-semibold text-[15px]"
                    >
                      View Details
                    </Link>
                  ) : null}

                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VillaProjects;
