import HeroSection from './Components/IntroSection';
import Navbar from './Components/Navbar';
import Features1 from './Components/Features1';
import UnifiedPlatformSection from './Components/Feature2';
import HowItWorks from './Components/HowItWorks';
const Homepage = () => {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <Features1 />
      <UnifiedPlatformSection />
      <HowItWorks />
    </div>
  );
};

export default Homepage;
