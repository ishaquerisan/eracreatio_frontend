import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaBuilding, FaLeaf, FaLocationDot, FaMagnifyingGlass, FaScaleBalanced } from 'react-icons/fa6';
import HeroSlider from '../components/HeroSlider';
import CounterSection from '../components/CounterSection';
import CTASection from '../components/CTASection';
import { getPublicVillas } from '../services/api';

const Home = () => {
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('ongoing');

  const statusTabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'completed', label: 'Completed' },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedProjects() {
      try {
        const response = await getPublicVillas();
        const villas = Array.isArray(response.villas) ? response.villas : [];

        const mappedProjects = villas.map((villa) => ({
          id: villa.id,
          slug: villa.slug,
          name: villa.name || 'Untitled Villa',
          location: villa.location || '-',
          status: String(villa.status || 'ongoing'),
          landArea: villa.acres || villa.overviewTotalLand || '-',
          units: villa.totalVillas || villa.overviewTotalUnits || '-',
          image: villa.bannerImage || villa.image || villa.images?.exterior?.[0] || '',
          logo: villa.projectLogo || villa.logo || '',
        }));

        if (isMounted) {
          setFeaturedProjects(mappedProjects);
        }
      } catch (_error) {
        if (!isMounted) {
          return;
        }
      }
    }

    loadFeaturedProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleProjects = featuredProjects.filter((project) => project.status.toLowerCase() === activeTab);
  const featuredProjectsToShow = visibleProjects.slice(0, 3);

  const whyChooseUs = [
    { icon: FaMagnifyingGlass, title: 'Transparency', description: 'No hidden costs. Complete clarity in pricing.' },
    { icon: FaScaleBalanced, title: 'Legality', description: '100% RERA,KMBR and KPBR compliance' },
    { icon: FaLeaf, title: 'Eco-Friendly', description: 'Sustainable building practices.' },
    { icon: FaBuilding, title: 'Engineering', description: 'Engineering-led project supervision.' }
  ];

  return (
    <main className="overflow-x-hidden">
      <HeroSlider />

      {/* CounterSection should handle its own internal responsiveness, 
         but placing it here ensures it follows the flow. 
      */}
      <CounterSection />

      {/* Introduction Section */}
      <section className="py-10 sm:py-16 lg:py-20 bg-bgLight ">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <img
                src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80"
                alt="Era Creatio"
                className="w-full h-56 sm:h-80 lg:h-auto object-cover rounded-xl shadow-xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2"
            >
              {/* Responsive Font: text-xl on mobile, text-5xl on desktop */}
              <h2 className="font-serif text-xl sm:text-3xl lg:text-5xl font-bold text-primary mb-3 md:mb-6">
                Welcome to Era Creatio Developers
              </h2>
              <div className="w-12 md:w-20 h-1 bg-accent mb-4 md:mb-6"></div>

              <p className="text-textGrey text-sm sm:text-lg leading-relaxed mb-4">
                Since 2018, Era Creatio Developers has been shaping modern living through premium villa communities,
                custom residences, and commercial developments, built with precision, quality, and a commitment to lasting value.
              </p>
              <p className="text-textGrey text-sm sm:text-lg leading-relaxed mb-6">

                With a strong foundation in engineering expertise and thoughtful design,
                we go beyond construction to create spaces that offer comfort, functionality,
                and long-term reliability for every client.
              </p>

              <Link
                to="/about"
                className="inline-block bg-accent text-white px-5 py-2.5 md:px-8 md:py-4 rounded-sm hover:bg-opacity-90 transition-all font-medium text-xs md:text-base"
              >
                Learn More
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section className="py-10 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 md:mb-16"
            >
              <h2 className="font-serif text-xl sm:text-4xl lg:text-5xl font-bold text-primary mb-2">
                Our Villa Projects
              </h2>
              <p className="text-textGrey text-xs sm:text-lg max-w-2xl mx-auto opacity-80">
                Signature developments redefining luxury living in Kerala.
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 sm:px-7 py-2.5 sm:py-3 rounded-full font-medium capitalize transition-all text-sm sm:text-base ${activeTab === tab.key
                    ? 'bg-accent text-white'
                    : 'bg-white text-primary border border-gray-200 hover:border-accent/40 hover:text-accent'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {featuredProjectsToShow.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 max-w-6xl mx-auto">
                  {featuredProjectsToShow.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
                    >
                      <div className="relative h-48 md:h-64 overflow-hidden">
                        <img
                          src={project.image}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        {project.logo ? (
                          <div className="absolute left-3 top-3 rounded-2xl border border-white/60 bg-white/90 p-2 shadow-lg backdrop-blur-sm">
                            <img src={project.logo} alt={`${project.name} logo`} className="h-8 w-16 object-contain md:h-10 md:w-20" />
                          </div>
                        ) : null}
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 rounded-sm text-[10px] md:text-xs font-bold bg-accent text-white uppercase tracking-wider">
                            {project.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 md:p-6">
                        <h3 className="font-serif text-lg md:text-2xl font-bold text-primary mb-1">{project.name}</h3>
                        <p className="text-textGrey text-xs md:text-base mb-3 flex items-center opacity-70">
                          <FaLocationDot className="mr-1 text-accent" />{project.location}
                        </p>

                        <div className="flex justify-between text-[10px] md:text-sm text-textGrey border-t pt-3 mb-4">
                          <span><strong>{project.landArea}</strong> Land</span>
                          <span><strong>{project.units}</strong> Units</span>
                        </div>

                        {(project.status.toLowerCase() === 'ongoing' || project.status.toLowerCase() === 'completed') ? (
                          <Link
                            to={`/villa/${project.slug || project.id}`}
                            className="inline-flex w-full items-center justify-center rounded-full bg-[#121212] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1f1f1f]"
                          >
                            View Details
                          </Link>
                        ) : null}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-8 md:mt-10 text-center">
                  <Link
                    to="/villa-projects"
                    className="inline-flex items-center justify-center rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition-colors hover:border-accent hover:text-accent"
                  >
                    Show All
                  </Link>
                </div>
              </>
            ) : (
              <div className="max-w-2xl mx-auto rounded-2xl border border-dashed border-gray-300 bg-white/70 px-6 py-10 text-center text-textGrey">
                No {activeTab} villa projects available right now.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-10 sm:py-20 bg-neutral-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="font-serif text-xl md:text-5xl font-bold text-primary mb-2">Why Choose Us</h2>
            <p className="text-textGrey text-xs md:text-lg">Transparency, quality, and commitment.</p>
          </div>

          {/* 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="bg-white p-4 md:p-8 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow">
                <item.icon className="text-2xl md:text-4xl mb-2 md:mb-4 text-accent mx-auto" />
                <h3 className="font-serif text-sm md:text-xl font-bold text-primary mb-1 md:mb-3">{item.title}</h3>
                <p className="text-textGrey text-[10px] md:text-base leading-tight md:leading-normal">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </main>
  );
};

export default Home;