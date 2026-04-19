import React from 'react';
import { motion } from 'framer-motion';
import { FaBullseye, FaCheck, FaHandshake, FaLightbulb, FaStar } from 'react-icons/fa6';
import { teamMembers } from '../data/projectsData';

const About = () => {
  const values = [
    { icon: FaBullseye, title: 'Vision', desc: 'To be Kerala\'s most trusted real estate developer' },
    { icon: FaLightbulb, title: 'Innovation', desc: 'Embracing futuristic technologies in construction' },
    { icon: FaHandshake, title: 'Integrity', desc: 'Building trust through transparency and honesty' },
    { icon: FaStar, title: 'Excellence', desc: 'Uncompromising quality in every project' }
  ];

  return (
    <div className="pt-24">
      {/* Hero Section */}
      <section className="relative py-32 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1920&q=80)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>
        </div>

        <div className="relative container mx-auto px-4 lg:px-8 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <h1 className="font-serif text-5xl lg:text-6xl font-bold mb-6">
              Building Dreams Since 2018
            </h1>
            <p className="text-xl text-gray-200">
              From a construction firm to Kerala's premier property developer, our journey is defined by trust, quality, and innovation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-bgLight">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-serif text-4xl lg:text-5xl font-bold text-primary mb-6">
                Our Story
              </h2>
              <div className="w-20 h-1 bg-accent mb-6"></div>
              <p className="text-textGrey text-lg leading-relaxed mb-6">
                Founded in 2018 in Kuttikattoor, Era Creatio Developers has quickly risen to become 
                a trusted name in Kerala's real estate sector. We pride ourselves on being a New Era 
                construction partner—utilizing futuristic technologies while maintaining traditional 
                values of trust and integrity.
              </p>
              <p className="text-textGrey text-lg leading-relaxed mb-6">
                What started as a vision to transform the construction landscape has evolved into a 
                legacy of creating homes and communities that stand the test of time. Our commitment 
                to RERA compliance, KMBR standards, and architectural excellence ensures that every 
                project we undertake becomes a landmark of quality.
              </p>
              <p className="text-textGrey text-lg leading-relaxed">
                Today, with over 55 completed projects and 300+ happy families, we continue to push 
                boundaries and redefine luxury living in Kerala.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 gap-4"
            >
              <img
                src="/about/about1.png"
                alt="About 1"
                className="w-full h-auto object-cover rounded-2xl shadow-lg"
              />
              <img
                src="/about/about2.png"
                alt="About 2"
                className="w-full h-auto object-cover rounded-2xl shadow-lg mt-8"
              />
              <img
                src="/about/about3.png"
                alt="About 3"
                className="w-full h-auto object-cover rounded-2xl shadow-lg"
              />
              <img
                src="/about/about4.png"
                alt="About 4"
                className="w-full h-auto object-cover rounded-2xl shadow-lg mt-8"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-primary mb-4">
              Our Core Values
            </h2>
            <p className="text-textGrey text-lg max-w-2xl mx-auto">
              The principles that guide every decision we make and every project we build.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-lg text-center hover:shadow-xl transition-all group"
              >
                <value.icon className="mx-auto text-4xl mb-4 text-accent group-hover:scale-110 transition-transform" />
                <h3 className="font-serif text-xl font-bold text-primary mb-3">
                  {value.title}
                </h3>
                <p className="text-textGrey">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-bgLight">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-primary mb-4">
              Meet Our Core Team
            </h2>
            <p className="text-textGrey text-lg max-w-2xl mx-auto">
              Experienced professionals dedicated to bringing your vision to life.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all group"
              >
                <div className="relative h-80 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="font-serif text-2xl font-bold text-primary mb-2">
                    {member.name}
                  </h3>
                  <p className="text-accent font-medium mb-1">{member.role}</p>
                  <p className="text-textGrey text-sm">{member.designation}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-primary mb-4">
              Why Choose Era Creatio
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { title: 'RERA Certified', desc: 'All projects registered and compliant with RERA regulations' },
              { title: 'KMBR Compliant', desc: 'Adhering to Kerala Municipality Building Rules' },
              { title: 'Quality Materials', desc: 'Premium materials sourced from trusted suppliers' },
              { title: 'Timely Delivery', desc: 'Committed to project timelines and deadlines' },
              { title: 'Transparent Pricing', desc: 'No hidden costs or surprise charges' },
              { title: 'After-Sales Support', desc: 'Comprehensive support even after handover' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-4 bg-white p-6 rounded-2xl shadow-lg"
              >
                <FaCheck className="text-accent text-xl mt-1 shrink-0" />
                <div>
                  <h3 className="font-serif text-xl font-bold text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-textGrey">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
