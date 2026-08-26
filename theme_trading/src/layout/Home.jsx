import Hero from "../components/section/Hero/Hero";
import Stats from "../components/section/Stats/Stats";
import Markets from "../components/section/Markets/Markets";
import Features from "../components/section/Features/Features";
import Terminal from "../components/section/Terminal/Terminal";
import HowItWorks from "../components/section/HowItWorks/HowItWorks";
import Pricing from "../components/section/Pricing/Pricing";
import Security from "../components/section/Security/Security";
import Testimonials from "../components/section/Testimonials/Testimonials";
import Faq from "../components/section/Faq/Faq";
import Cta from "../components/section/Cta/Cta";
import Footer from "../common/Footer/Footer";
import useReveal from "../hooks/useReveal";
import "../components/section/sections.css";

const Home = () => {
  useReveal();

  return (
    // Each section owns its own .container. Wrapping them in another one here
    // would nest containers and narrow every section by a gutter.
    <main className="home-page">
      <Hero />
      <Stats />
      <Markets />
      <Features />
      <Terminal />
      <HowItWorks />
      <Pricing />
      <Security />
      <Testimonials />
      <Faq />
      <Cta />
      <Footer />
    </main>
  );
};

export default Home;
