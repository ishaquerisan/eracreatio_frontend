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
      { threshold: 0.1 } // Lower threshold for better mobile trigger
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
    }, [end, duration, isVisible]);

    return <span>{count}{suffix}</span>;
  };

  return (
    <section ref={sectionRef} className="py-8 md:py-20 bg-primary text-white border-b border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* MOBILE: grid-cols-2 (compact 2x2 layout)
            DESKTOP: lg:grid-cols-4 (standard row)
        */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-4 md:gap-8">
          {counters.map((counter, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="text-center px-2"
            >
              {/* NUMBER SIZE: 
                  Mobile: text-2xl 
                  Desktop: lg:text-5xl 
              */}
              <div className="font-serif text-2xl sm:text-3xl lg:text-5xl font-bold text-accent mb-1 md:mb-3">
                <Counter end={counter.value} suffix={counter.suffix} />
              </div>
              
              {/* LABEL SIZE: 
                  Mobile: text-[10px] (Extremely clean/minimal)
                  Desktop: lg:text-sm 
              */}
              <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.2em] font-medium leading-tight">
                {counter.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CounterSection;