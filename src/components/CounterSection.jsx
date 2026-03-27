import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const CounterSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const counters = [
    { label: 'Established', value: 2018, suffix: '' },
    { label: 'Happy Families', value: 500, suffix: '+' },
    { label: 'Completed Projects', value: 55, suffix: '+' },
    { label: 'Running Projects', value: 20, suffix: '+' }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const Counter = ({ end, suffix, duration = 2000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      let startTime;
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = (currentTime - startTime) / duration;

        if (progress < 1) {
          setCount(Math.floor(end * progress));
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(animate);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [end, duration]);

    return <span>{count}{suffix}</span>;
  };

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-20 bg-primary text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {counters.map((counter, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="text-center"
            >
              <div className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-accent mb-2">
                <Counter end={counter.value} suffix={counter.suffix} />
              </div>
              <p className="text-gray-400 text-xs sm:text-sm lg:text-base">{counter.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CounterSection;
