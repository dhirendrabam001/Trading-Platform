import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import Model from "./Model";
import Lights from "./Lights";

const Scene = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
      }}
    >
      <Lights />
      <Suspense fallback={null}>
        <Model />
      </Suspense>
      <Environment preset="city" />
    </Canvas>
  );
};

export default Scene;
