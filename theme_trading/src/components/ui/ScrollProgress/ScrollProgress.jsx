import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import "./ScrollProgress.css";

// Reads the document's scroll progress and paints it as a hairline under the
// navbar. useScroll tracks the real scroll position, which is what Lenis
// drives, so the two stay in step without any wiring between them.
const ScrollProgress = () => {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  // The spring is what stops the bar snapping between values on fast wheel
  // scrolls — it trails the pointer the way the Lenis scroll itself does.
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="scroll-progress"
      style={{ scaleX: reduce ? scrollYProgress : scaleX }}
      aria-hidden="true"
    />
  );
};

export default ScrollProgress;
