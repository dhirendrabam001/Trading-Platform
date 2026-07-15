import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Model = () => {
  const ref = useRef();
  const { scene } = useGLTF("/model.glb");

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.to(ref.current.rotation, {
        y: Math.PI * 2,
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return <primitive ref={ref} object={scene} scale={1.5} />;
};

export default Model;
