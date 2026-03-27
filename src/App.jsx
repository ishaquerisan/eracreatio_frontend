import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import VillaProjects from './pages/VillaProjects';
import EraEmerald from './pages/EraEmerald';
import IndependentResidences from './pages/IndependentResidences';
import CommercialProjects from './pages/CommercialProjects';
import About from './pages/About';
import Blog from './pages/Blog';
import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/villa-projects" element={<VillaProjects />} />
            <Route path="/villa/era-emerald" element={<EraEmerald />} />
            <Route path="/independent-residences" element={<IndependentResidences />} />
            <Route path="/commercial-projects" element={<CommercialProjects />} />
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
