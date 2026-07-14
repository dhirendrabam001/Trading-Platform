import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

/**
 * Wireframe icosahedron core.
 * Two nested shells rotating at different speeds = a "network" feel —
 * reads as the market data mesh Nexa is trading through.
 */
function WireOrb() {
  const outerRef = useRef();
  const innerRef = useRef();

  useFrame((state, delta) => {
    outerRef.current.rotation.y += delta * 0.09;
    outerRef.current.rotation.x += delta * 0.025;
    innerRef.current.rotation.y -= delta * 0.06;
    innerRef.current.rotation.x -= delta * 0.015;

    // gentle pointer parallax, matches the phone tilt already happening in GSAP
    const { x, y } = state.pointer;
    outerRef.current.rotation.y += x * 0.0006;
    outerRef.current.rotation.x += -y * 0.0006;
  });

  return (
    <group>
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.55, 1]} />
        <meshBasicMaterial
          color="#00ffb2"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshBasicMaterial
          color="#3b82f6"
          wireframe
          transparent
          opacity={0.22}
        />
      </mesh>
    </group>
  );
}

/**
 * Loose sphere of points drifting around the orb — ambient "market tick" dust.
 * Built with raw BufferGeometry so there's no dependency on drei's Sparkles/Points helpers.
 */
function TickField() {
  const pointsRef = useRef();

  const positions = useMemo(() => {
    const count = 180;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.1 + Math.random() * 1.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    pointsRef.current.rotation.y += delta * 0.015;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#00ffb2"
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Drop this behind the phone mockup in the hero's visual column.
 * Transparent canvas, no lights needed since everything uses MeshBasicMaterial.
 */
const HeroOrb = () => {
  return (
    <Canvas
      className="hero-orb-canvas"
      camera={{ position: [0, 0, 5.2], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
    >
      <WireOrb />
      <TickField />
    </Canvas>
  );
};

export default HeroOrb;
