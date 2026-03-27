import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { villaProjects } from '../data/projectsData';

const VillaProjects = () => {
  const [activeTab, setActiveTab] = useState('ongoing');

  const projects = activeTab === 'ongoing' ? villaProjects.ongoing : villaProjects.upcoming;

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
          <div className="flex justify-center space-x-3 sm:space-x-4 mb-10 sm:mb-12">
            {['ongoing', 'upcoming'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-luxury font-medium capitalize transition-all text-sm sm:text-base ${
                  activeTab === tab ? 'bg-accent text-white' : 'bg-white text-primary hover:bg-gray-100'
                }`}
              >
                {tab === 'ongoing' ? 'Ongoing' : 'Upcoming'}
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
                className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative h-52 sm:h-64 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      project.status === 'Ongoing' ? 'bg-accent text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary mb-1">{project.name}</h3>
                  <p className="text-textGrey text-sm sm:text-base mb-3 flex items-center">
                    <span className="mr-2">📍</span>{project.location}
                  </p>
                  <div className="flex justify-between text-xs sm:text-sm text-textGrey mb-4">
                    <span><strong className="text-primary">{project.landArea}</strong> Land</span>
                    <span><strong className="text-primary">{project.units}</strong></span>
                  </div>
                  {project.status === 'Ongoing' ? (
                    <Link
                      to={`/villa/${project.id}`}
                      className="block w-full text-center bg-primary text-white py-2.5 sm:py-3 rounded-luxury hover:bg-accent transition-colors font-medium text-sm sm:text-base"
                    >
                      View Details
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="block w-full text-center bg-gray-200 text-gray-500 py-2.5 sm:py-3 rounded-luxury font-medium text-sm sm:text-base cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  )}
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
