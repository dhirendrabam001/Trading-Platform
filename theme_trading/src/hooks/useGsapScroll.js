import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGsapScroll(callback, deps = []) {
  const ref = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      callback(ref.current);
    }, ref);

    return () => ctx.revert();
  }, deps);

  return ref;
}
