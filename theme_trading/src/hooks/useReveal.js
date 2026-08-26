import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Scroll choreography for the landing page.
//
// The hidden starting state lives behind an .nx-ready class that is added
// here, at runtime. That ordering matters: if this hook never runs — a JS
// error, a blocked bundle — the class is never added and the whole page
// stays visible instead of rendering as a column of blank space.
export function useReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    root.classList.add("nx-ready");

    const ctx = gsap.context(() => {
      // 1. Base reveal. batch() groups whatever crosses the line together, so
      //    a row of cards staggers as a row instead of each firing alone.
      ScrollTrigger.batch(".nx-reveal", {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.09,
            ease: "power3.out",
            overwrite: true,
          }),
      });

      // 2. Ambient glows drift slower than the page. Scrubbed rather than
      //    timed, so the depth reads on the way back up as well.
      gsap.utils.toArray(".nx-sec-glow").forEach((glow) => {
        const section = glow.closest("section");
        if (!section) return;

        gsap.fromTo(
          glow,
          { yPercent: -12 },
          {
            yPercent: 12,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.9,
            },
          },
        );
      });

      // 3. Anything marked data-tilt-in arrives on a slight 3D rotation and
      //    settles flat — used for the big terminal panel, where a plain
      //    fade would waste the size of the element.
      gsap.utils.toArray("[data-tilt-in]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 60,
          rotateX: 9,
          scale: 0.965,
          transformPerspective: 1200,
          transformOrigin: "50% 100%",
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      });

      // 4. Generic scrubbed parallax. data-parallax="-40" moves the element
      //    40px against the scroll across its own travel.
      gsap.utils.toArray("[data-parallax]").forEach((el) => {
        const distance = parseFloat(el.dataset.parallax) || -40;

        gsap.fromTo(
          el,
          { y: -distance / 2 },
          {
            y: distance / 2,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          },
        );
      });
    });

    // A late-loading webfont or image changes element offsets, so the
    // trigger positions have to be recalculated once things settle.
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      ctx.revert();
      root.classList.remove("nx-ready");
    };
  }, []);
}

export default useReveal;
