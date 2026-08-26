import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Height of the sticky navbar. An anchor jump has to stop short by this much
// or the section heading lands underneath it.
const NAV_OFFSET = -92;

export default function SmoothScroll({ children }) {
  useEffect(() => {
    // Smoothed scrolling is exactly the kind of motion this setting asks us
    // to drop — the page falls back to the browser's native scroll.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    // ScrollTrigger has to be told the position on every Lenis frame, and
    // Lenis has to be driven from GSAP's ticker — otherwise the two run on
    // separate clocks and scrubbed animations judder.
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // In-page anchors must be routed through Lenis. A native hash jump sets
    // the scroll position directly, which fights the smoothed value and
    // leaves the page somewhere between the two.
    const onAnchorClick = (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const id = link.getAttribute("href").slice(1);
      if (!id) return;

      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      lenis.scrollTo(target, { offset: NAV_OFFSET, duration: 1.25 });
    };

    document.addEventListener("click", onAnchorClick);

    // Late webfonts and images shift every trigger position
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      window.removeEventListener("load", onLoad);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
