import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import HeroSection from '../../components/HeroSection';
import ExploreCategories from '../../components/ExploreCategories';
import FeaturedCompanies from '../../components/FeaturedCompanies';
import BusinessOpportunity from '../../components/BusinessOpportunity';
import FeaturedProducts from '../../components/FeaturedProducts';
import BusinessSpotlight from '../../components/BusinessSpotlight';
import LatestNews from '../../components/LatestNews';
import CTABanner from '../../components/CTABanner';
import Newsletter from '../../components/Newsletter';
import Footer from '../../components/Footer';

export default function LandingPage() {
  const navigate = useNavigate();

  // If already logged in, redirect to Dashboard automatically so user is never logged out unexpectedly
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('fortaa_user') || 'null');
      if (user && (user.id || user.email)) {
        navigate('/dashboard', { replace: true });
      }
    } catch {
      // not logged in
    }
  }, [navigate]);

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ExploreCategories />
        <FeaturedCompanies />
        <BusinessOpportunity />
        <LatestNews />
        <CTABanner />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
