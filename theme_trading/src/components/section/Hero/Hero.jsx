import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import phoneMockup from "/Images/hero-img.webp";

import { useGsapScroll } from "../../../hooks/useGsapScroll";
import "./Hero.css";
import HeroOrb from "../../canvas/HeroOrb/HeroOrb";

const TICKER_ITEMS = [
  { sym: "BTC", price: "64,218", delta: "+2.4%", up: true },
  { sym: "ETH", price: "3,142", delta: "-0.8%", up: false },
  { sym: "AAPL", price: "221.05", delta: "+1.1%", up: true },
  { sym: "EUR/USD", price: "1.0842", delta: "-0.2%", up: false },
  { sym: "GOLD", price: "2,398", delta: "+0.6%", up: true },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const Hero = () => {
  const visualColRef = useRef(null);
  const phoneStageRef = useRef(null);
  const phoneRef = useRef(null);
  const glareRef = useRef(null);
  const chip1Ref = useRef(null);
  const chip2Ref = useRef(null);
  const orbitRef = useRef(null);
  const tickerTrackRef = useRef(null);

  const [showOrb, setShowOrb] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const roomy = window.matchMedia("(min-width: 992px)").matches;
    setShowOrb(!reduceMotion && roomy);
  }, []);

  // GSAP Choreography: High-End Cinematic 3D Entrance + Ambient Loops
  useEffect(() => {
    const isReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      // 1. Setup the master structural timeline
      const tl = gsap.timeline();

      if (!isReduced) {
        // Prepare initial hidden state out-of-view for the 3D fly-in.
        // filter: blur() is included so the phone resolves into focus as it
        // settles, rather than just popping in at full sharpness.
        gsap.set(phoneRef.current, {
          opacity: 0,
          scale: 0.5,
          rotateY: -90,
          rotateX: 45,
          z: -300,
          filter: "blur(8px) drop-shadow(0px 30px 60px rgba(0,0,0,0.6))",
          transformPerspective: 1200,
        });

        // Trigger the cinematic 3D Fly-in
        tl.to(phoneRef.current, {
          opacity: 1,
          scale: 1,
          rotateY: 0,
          rotateX: 0,
          z: 0,
          filter: "blur(0px) drop-shadow(0px 30px 60px rgba(0,0,0,0.6))",
          duration: 1.8,
          ease: "power4.out",
          delay: 0.4, // Syncs with the text reveal timing
          onComplete: () => {
            // Once the entrance is completed, start the continuous ambient breathing loops
            gsap.to(phoneStageRef.current, {
              rotateY: 16,
              duration: 5,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              transformPerspective: 900,
            });

            gsap.to(phoneStageRef.current, {
              scale: 1.05,
              duration: 4.2,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              delay: 0.3,
            });

            gsap.to(phoneRef.current, {
              y: -14,
              duration: 3.2,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
          },
        });
      } else {
        // Fallback plain opacity toggle for users with reduced motion settings
        gsap.set(phoneRef.current, { opacity: 0, y: 20 });
        tl.to(phoneRef.current, { opacity: 1, y: 0, duration: 0.8 });
      }

      // Continuous ambient loops for secondary components
      gsap.to(chip1Ref.current, {
        y: -10,
        duration: 2.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 0.3,
      });

      gsap.to(chip2Ref.current, {
        y: 12,
        duration: 2.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 0.6,
      });

      gsap.to(orbitRef.current, {
        rotate: 360,
        duration: 40,
        repeat: -1,
        ease: "none",
        transformOrigin: "50% 50%",
      });

      const trackEl = tickerTrackRef.current;
      const trackWidth = trackEl.scrollWidth / 2;
      gsap.to(trackEl, {
        x: -trackWidth,
        duration: 18,
        ease: "none",
        repeat: -1,
      });
    });

    return () => ctx.revert();
  }, []);

  // GSAP Mouse Parallax Integration
  useEffect(() => {
    const visualCol = visualColRef.current;
    const phone = phoneRef.current;
    if (!window.matchMedia("(hover: hover)").matches) return;

    const handleMouseMove = (e) => {
      const rect = visualCol.getBoundingClientRect();
      const relX = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const relY = (e.clientY - rect.top - rect.height / 2) / rect.height;

      gsap.to(phone, {
        rotateY: relX * 14,
        rotateX: -relY * 14,
        transformPerspective: 1000,
        // Shadow shifts opposite the tilt direction so the phone reads as
        // physically lifting off the page, not just rotating in place.
        filter: `drop-shadow(${-relX * 20}px ${20 - relY * 10}px 40px rgba(0,0,0,0.5))`,
        duration: 0.8,
        ease: "power2.out",
      });

      // Glare sweeps across the glossy screen surface as it tilts.
      gsap.to(glareRef.current, {
        backgroundPosition: `${50 + relX * 60}% ${50 + relY * 60}%`,
        duration: 0.8,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(phone, {
        rotateY: 0,
        rotateX: 0,
        filter: "drop-shadow(0px 20px 40px rgba(0,0,0,0.5))",
        duration: 1.2,
        ease: "power3.out",
      });

      gsap.to(glareRef.current, {
        backgroundPosition: "50% 50%",
        duration: 1.2,
        ease: "power3.out",
      });
    };

    visualCol.addEventListener("mousemove", handleMouseMove);
    visualCol.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      visualCol.removeEventListener("mousemove", handleMouseMove);
      visualCol.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const sectionRef = useGsapScroll((el) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.to(el.querySelector(".hero-copy"), {
      yPercent: 10,
      opacity: 0.35,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      },
    });

    // Scroll-linked tilt on the phone stage. Mouse parallax is disabled on
    // touch devices (see the "(hover: hover)" guard above), so this gives
    // touch users an equivalent sense of depth/interactivity as they scroll.
    gsap.to(phoneStageRef.current, {
      rotateY: 8,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "top top",
        scrub: 0.8,
      },
    });
  }, []);

  return (
    <section className="hero-section" ref={sectionRef}>
      <div className="container position-relative">
        <div className="row align-items-center">
          <motion.div
            className="col-lg-6 hero-copy"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={item} className="eyebrow-badge">
              <span className="eyebrow-dot" />
              LIVE &middot; 24/7 MARKET ACCESS
            </motion.div>

            <motion.h1 variants={item} className="hero-heading">
              Trade every market,
              <br />
              <span className="grad-word">move at the speed</span>
              <br />
              of the price.
            </motion.h1>

            <motion.p variants={item} className="hero-sub">
              Nexa gives you one balance across stocks, crypto, and FX &mdash;
              with sub-second execution, transparent fees, and a wallet that
              settles the moment your trade fills.
            </motion.p>

            <motion.div variants={item} className="hero-cta-row">
              <a href="#" className="btn-nexa-primary">
                Get Started &rarr;
              </a>
              <a href="#" className="btn-nexa-ghost">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5 3.5V12.5L12.5 8L5 3.5Z" fill="currentColor" />
                </svg>
                Watch demo
              </a>
            </motion.div>

            <motion.div variants={item} className="ticker-wrap">
              <div className="ticker-track" ref={tickerTrackRef}>
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
                  <div className="ticker-item" key={i}>
                    <span className="ticker-sym">{t.sym}</span>
                    <span className="ticker-price">{t.price}</span>
                    <span className={t.up ? "ticker-up" : "ticker-down"}>
                      {t.up ? "▲" : "▼"} {t.delta}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <div className="col-lg-6">
            <div className="visual-col" ref={visualColRef}>
              {showOrb && (
                <div className="hero-orb-wrap">
                  <HeroOrb />
                </div>
              )}
              <div className="visual-glow" />
              <div className="orbit-ring r1" />
              <div className="orbit-ring r2" ref={orbitRef} />

              <div className="phone-stage" ref={phoneStageRef}>
                {/*
                  Framer Motion parameters removed from this div layer.
                  GSAP handles this exclusively using full 3D transform matrices now.
                */}
                <div className="phone-mockup-wrap" ref={phoneRef}>
                  <img
                    src={phoneMockup}
                    alt="Nexa wallet app showing balance and transaction history"
                  />
                  {/* Glossy light sweep, repositioned on tilt via GSAP */}
                  <div className="phone-glare" ref={glareRef} />
                </div>
              </div>

              {/* Framer motion wrapper containers for smooth entry coordinate animations */}
              <motion.div
                className="floating-chip chip-1"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                {/* Inner div nested handler attached safely to the continuous GSAP floating loop */}
                <div
                  ref={chip1Ref}
                  className="chip-inner-wrap"
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div className="chip-icon">&#8593;</div>
                  <div>
                    <div className="chip-label">Deposit received</div>
                    <div className="chip-value">+&pound;420.00</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="floating-chip chip-2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <div
                  ref={chip2Ref}
                  className="chip-inner-wrap"
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div className="chip-icon">&#8776;</div>
                  <div>
                    <div className="chip-label">Portfolio, 24h</div>
                    <div
                      className="chip-value"
                      style={{ color: "var(--up-green)" }}
                    >
                      +3.8%
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
