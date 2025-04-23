import HeroSection from './Components/IntroSection';
import Navbar from './Components/Navbar';
import Features1 from './Components/Features1';
import UnifiedPlatformSection from './Components/Feature2';
import HowItWorks from './Components/HowItWorks';
import TestimonialsCarousel from './Components/Test';
import TeamSection from './Components/Team'; 
import Footer from './Components/Footer';
const Homepage = () => {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <Features1 />
      <UnifiedPlatformSection />
      <HowItWorks />
      <TestimonialsCarousel /> 
      <TeamSection />
      <Footer />
    </div>
  );
};
export default Homepage; 
