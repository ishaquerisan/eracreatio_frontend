import React from 'react';
import { motion } from 'framer-motion';
import { FaLocationDot } from 'react-icons/fa6';

const ProjectCard = ({ project, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden">
        <img
          src={project.image}
          alt={project.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {/* Status Badge */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
          <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold ${
            project.status === 'Ongoing' 
              ? 'bg-accent text-white' 
              : 'bg-green-500 text-white'
          }`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary mb-2">
          {project.name}
        </h3>
        <p className="text-textGrey text-sm sm:text-base mb-4 flex items-center">
          <FaLocationDot className="mr-2 text-accent" />
          {project.location}
        </p>

        <div className="flex items-center justify-between mb-4 text-xs sm:text-sm text-textGrey">
          {project.landArea && (
            <div>
              <span className="font-semibold text-primary">{project.landArea}</span>
              <span className="ml-1">Land</span>
            </div>
          )}
          {project.units && (
            <div>
              <span className="font-semibold text-primary">{project.units}</span>
              <span className="ml-1">Units</span>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};

export default ProjectCard;
