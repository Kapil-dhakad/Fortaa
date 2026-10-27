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
