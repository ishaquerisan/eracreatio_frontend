import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import VillaProjects from './pages/VillaProjects';
import EraEmerald from './pages/EraEmerald';
import IndependentResidences from './pages/IndependentResidences';
import IndependentResidencesGallery from './pages/IndependentResidencesGallery';
import CommercialProjects from './pages/CommercialProjects';
import CommercialProjectsGallery from './pages/CommercialProjectsGallery';
import About from './pages/About';
import Blog from './pages/Blog';
import Contact from './pages/Contact';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/villa-projects" element={<VillaProjects />} />
            <Route path="/villa/era-emerald" element={<EraEmerald />} />
            <Route path="/independent-residences" element={<IndependentResidences />} />
            <Route path="/independent-residences/gallery" element={<IndependentResidencesGallery />} />
            <Route path="/commercial-projects" element={<CommercialProjects />} />
            <Route path="/commercial-projects/gallery" element={<CommercialProjectsGallery />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </Router>
  );
}

export default App;
