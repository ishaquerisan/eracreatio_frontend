# Era Creatio Developers - Luxury Real Estate Website

A modern, premium luxury real estate website built with React.js for Era Creatio Developers LLP.

## Features

- 🏠 Full-screen hero slider with smooth transitions
- 📊 Animated counter section
- 🏘️ Villa projects with ongoing/completed tabs
- 🏡 Independent residences showcase
- 🏢 Commercial projects portfolio
- 👥 About us with team profiles
- 📝 Knowledge hub (blog)
- 📞 Contact form with map integration
- 💬 WhatsApp floating button
- 📱 Fully responsive design
- ✨ Smooth animations with Framer Motion

## Tech Stack

- React.js 18
- React Router DOM 6
- Framer Motion (animations)
- Tailwind CSS (styling)
- Google Fonts (Playfair Display & Poppins)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure frontend API URL:
```bash
# .env (in project root)
REACT_APP_API_URL=http://localhost:5000/api
```

3. Start frontend development server:
```bash
npm start
```

4. Build for production:
```bash
npm run build
```

## Backend (Node.js + Express + MySQL)

1. Open a new terminal and install backend dependencies:
```bash
cd server
npm install
```

2. Create backend environment file:
```bash
copy .env.example .env
```

3. Ensure MySQL is running with these credentials:
- Username: `root`
- Password: `mysql`

4. Start backend server:
```bash
npm run dev
```

The backend auto-creates required MySQL tables:
- `newsletter_subscribers`
- `contact_inquiries`

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── HeroSlider.jsx
│   ├── CounterSection.jsx
│   ├── ProjectCard.jsx
│   ├── CTASection.jsx
│   └── WhatsAppButton.jsx
├── pages/
│   ├── Home.jsx
│   ├── VillaProjects.jsx
│   ├── IndependentResidences.jsx
│   ├── CommercialProjects.jsx
│   ├── About.jsx
│   ├── Blog.jsx
│   └── Contact.jsx
├── data/
│   └── projectsData.js
├── App.jsx
└── index.js
```

## Design System

### Colors
- Primary: #111111 (Charcoal Black)
- Secondary: #FFFFFF (White)
- Accent: #C6A769 (Luxury Gold)
- Background Light: #F8F8F8
- Text Grey: #666666

### Typography
- Headings: Playfair Display (serif)
- Body: Poppins (sans-serif)

## Pages

1. **Home** - Hero slider, counters, featured projects, why choose us
2. **Villa Projects** - Ongoing/completed tabs, project cards, amenities
3. **Independent Residences** - Custom home features, process timeline, gallery
4. **Commercial Projects** - Business spaces, premium features
5. **About Us** - Company story, values, team profiles
6. **Knowledge Hub** - Blog posts with categories
7. **Contact** - Contact form, info, map placeholder

## Customization

- Update project data in `src/data/projectsData.js`
- Modify colors in `tailwind.config.js`
- Replace placeholder images with actual project photos
- Add Google Maps API key for map integration

## Contact

Era Creatio Developers LLP
- Address: AP Complex, Kuttikattor, Calicut, Kerala - 673008
- Phone: +91 7907 30 40 50, +91 96452 87355
- Email: eracreatiodevelopers@gmail.com

## License

© 2026 Era Creatio Developers LLP. All rights reserved.
