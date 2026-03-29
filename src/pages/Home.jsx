import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaBuilding, FaLeaf, FaLocationDot, FaMagnifyingGlass, FaScaleBalanced } from 'react-icons/fa6';
import HeroSlider from '../components/HeroSlider';
import CounterSection from '../components/CounterSection';
import CTASection from '../components/CTASection';
import { villaProjects } from '../data/projectsData';

const Home = () => {
  const allProjects = [...villaProjects.ongoing, ...villaProjects.upcoming];

  const whyChooseUs = [
    { icon: FaMagnifyingGlass, title: 'Transparency', description: 'No hidden costs. Complete clarity in pricing and documentation.' },
    { icon: FaScaleBalanced, title: 'Legality', description: '100% RERA and KMBR compliance for your peace of mind.' },
    { icon: FaLeaf, title: 'Eco-Friendly', description: 'Sustainable building practices for a greener tomorrow.' },
    { icon: FaBuilding, title: 'Engineering Excellence', description: 'Engineering-led project supervision ensuring quality.' }
  ];

  return (
    <div>
      <HeroSlider />
      <CounterSection />

      {/* Introduction Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-bgLight">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img
                src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80"
                alt="Era Creatio"
                className="rounded-xl sm:rounded-2xl shadow-2xl"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4 sm:mb-6">
                Welcome to Era Creatio Developers
              </h2>
              <div className="w-16 sm:w-20 h-1 bg-accent mb-4 sm:mb-6"></div>
              <p className="text-textGrey text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
                Since 2018, we have evolved from a construction firm into a premier property developer.
                We don't just build structures; we curate lifestyles.
              </p>
              <p className="text-textGrey text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
                Our commitment to RERA standards, KMBR compliance, and architectural excellence ensures
                your investment is secure and your home is timeless.
              </p>
              <Link
                to="/about"
                className="inline-block bg-accent text-white px-6 sm:px-8 py-3 sm:py-4 rounded-luxury hover:bg-opacity-90 transition-all font-medium text-sm sm:text-base"
              >
                Learn More About Us
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 lg:mb-16"
          >
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-3 sm:mb-4">
              Our Villa Projects
            </h2>
            <p className="text-textGrey text-base sm:text-lg max-w-2xl mx-auto px-4">
              Discover our signature developments that redefine luxury living in Kerala.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {allProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
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
                    <FaLocationDot className="mr-2 text-accent" />{project.location}
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
                    <div className="block w-full text-center bg-gray-100 text-gray-400 py-2.5 sm:py-3 rounded-luxury font-medium text-sm sm:text-base">
                      Coming Soon
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-12">
            <Link
              to="/villa-projects"
              className="inline-block border-2 border-accent text-accent px-6 sm:px-8 py-3 sm:py-4 rounded-luxury hover:bg-accent hover:text-white transition-all font-medium text-sm sm:text-base"
            >
              View All Projects
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 sm:py-16 lg:py-20 bg-bgLight">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12 lg:mb-16"
          >
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-3 sm:mb-4">
              Why Choose Era Creatio
            </h2>
            <p className="text-textGrey text-base sm:text-lg max-w-2xl mx-auto px-4">
              Building trust through transparency, quality, and commitment to excellence.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-white/60 backdrop-blur-sm p-6 sm:p-8 rounded-xl sm:rounded-2xl text-center hover:shadow-xl transition-all group"
              >
                <item.icon className="text-3xl sm:text-4xl mb-3 sm:mb-4 text-accent mx-auto group-hover:scale-110 transition-transform" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-primary mb-2 sm:mb-3">
                  {item.title}
                </h3>
                <p className="text-textGrey text-sm sm:text-base">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </div>
  );
};

export default Home;
