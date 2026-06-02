import Navigation from './Navigation';
import SplashScreen from './SplashScreen';
import AboutScreen from './AboutScreen';
import FeaturesScreen from './FeaturesScreen';


function LandingPage() {
  return (

    <div>
      <Navigation />
        <section id="start">
            <SplashScreen />
        </section>

        <section id="about">
            <AboutScreen />
        </section>

        <section id="features">
            <FeaturesScreen />
        </section>

    </div>
  );
}


export default LandingPage;

