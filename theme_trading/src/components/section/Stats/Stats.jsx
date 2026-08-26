import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Stats.css";

gsap.registerPlugin(ScrollTrigger);

// NOTE: placeholder figures. Swap these for audited numbers before launch —
// see the `value`/`prefix`/`suffix` fields.
const STATS = [
  { value: 4.8, prefix: "$", suffix: "B", decimals: 1, label: "Monthly volume traded" },
  { value: 320, prefix: "", suffix: "K+", decimals: 0, label: "Funded trading accounts" },
  { value: 99.98, prefix: "", suffix: "%", decimals: 2, label: "Matching engine uptime" },
  { value: 42, prefix: "<", suffix: "ms", decimals: 0, label: "Median order execution" },
];

const Stats = () => {
  const rootRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      rootRef.current.querySelectorAll("[data-count]").forEach((el) => {
        const target = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals, 10);

        // Reduced motion still needs the final number painted, just without
        // the tally running up to it.
        if (reduce) {
          el.textContent = target.toFixed(decimals);
          return;
        }

        const counter = { n: 0 };
        gsap.to(counter, {
          n: target,
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            el.textContent = counter.n.toFixed(decimals);
          },
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="nx-sec nx-sec--tight stats-sec" ref={rootRef}>
      <div className="container">
        <div className="stats-band nx-reveal">
          {STATS.map((s) => (
            <div className="stats-item" key={s.label}>
              <div className="stats-value">
                {s.prefix}
                <span data-count={s.value} data-decimals={s.decimals}>
                  0
                </span>
                {s.suffix}
              </div>
              <p className="stats-label">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
