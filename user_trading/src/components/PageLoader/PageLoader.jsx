import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MDDLoader } from "three/addons/loaders/MDDLoader.js";
import "./PageLoader.css";

const MODEL_URL = "/models/mdd/cube.mdd";

// Long enough for the full intro to play: the cube opens wide and square, the
// camera pushes in, and it settles flat. A fast API response still holds the
// loader for MIN_VISIBLE_MS.
const MIN_VISIBLE_MS = 2000;
// Must match the .page-loader--exit transition in PageLoader.css
const FADE_MS = 450;

// Intro dolly. Both ends sit on the (1,1,1) sight line of the reference
// example -- only the distance changes, which is what keeps the face colors
// identical throughout (MeshNormalMaterial shades in view space, so rotating
// the camera would shift them).
const CAM_START = 2.6; // wide: cube reads as a small, clean cube
const CAM_END = 1.7; // close: cube fills the stage, perspective exaggerated
// Matches the clip's squash peak at ~1.4s, so the dolly settles on the flat pose
const ZOOM_MS = 1400;

const PageLoader = ({ show, message = "Loading your dashboard" }) => {
  const [mounted, setMounted] = useState(show);
  const [exiting, setExiting] = useState(false);
  const shownAtRef = useRef(0);

  // Mount on show, then hold for the minimum duration and fade out
  useEffect(() => {
    if (show) {
      shownAtRef.current = Date.now();
      setExiting(false);
      setMounted(true);
      return;
    }

    if (!mounted) return;

    const elapsed = Date.now() - shownAtRef.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

    const fadeTimer = setTimeout(() => setExiting(true), wait);
    const unmountTimer = setTimeout(() => {
      setExiting(false);
      setMounted(false);
    }, wait + FADE_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [show, mounted]);

  // Freeze the page behind the overlay so a half-rendered dashboard can't be
  // scrolled while the loader covers it
  useEffect(() => {
    if (!mounted) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      className={`page-loader ${exiting ? "page-loader--exit" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* Depth behind the cube: drifting aurora + a floor grid running toward
          the viewer in real CSS 3D. Kept out of the WebGL scene on purpose --
          the canvas is only as big as the cube's stage, so a grid drawn in
          there could never reach the edges of the screen. */}
      <div className="page-loader__backdrop" aria-hidden="true">
        <span className="page-loader__aurora page-loader__aurora--one" />
        <span className="page-loader__aurora page-loader__aurora--two" />
        <span className="page-loader__grid" />
      </div>

      <LoaderScene />
    </div>
  );
};

/* The WebGL half is split out so the overlay's mount/fade state changes never
   re-run the scene effect and rebuild the renderer. */
const LoaderScene = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = mount.clientWidth || 1;
    let height = mount.clientHeight || 1;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    // Equal components matter: they put +X on the right and +Z on the left,
    // which is what gives the magenta / blue faces.
    camera.position.set(CAM_START, CAM_START, CAM_START);
    camera.lookAt(scene.position);

    const timer = new THREE.Timer();
    timer.connect(document);

    // alpha:true so the overlay's gradient shows through the canvas
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    let mixer = null;
    let mesh = null;
    let disposed = false;
    // Elapsed time at which the model appeared. The dolly is keyed off this
    // rather than off mount, so a slow fetch can't eat the wide opening shot.
    let zoomFrom = null;

    const loader = new MDDLoader();
    loader.load(
      MODEL_URL,
      (result) => {
        // The loader can be dismissed while the model is still in flight
        if (disposed) return;

        const geometry = new THREE.BoxGeometry();
        geometry.morphAttributes.position = result.morphTargets;

        mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial());
        scene.add(mesh);

        mixer = new THREE.AnimationMixer(mesh);
        mixer.clipAction(result.clip).play();

        // Clip and dolly start on the same frame, so the cube is square at its
        // smallest and flattest right as the camera settles
        zoomFrom = timer.getElapsed();
      },
      undefined,
      (error) => console.error("MDD load failed:", error),
    );

    const animate = () => {
      timer.update();

      const delta = timer.getDelta();

      if (mixer) mixer.update(delta);

      if (zoomFrom !== null) {
        const progress = Math.min(
          1,
          (timer.getElapsed() - zoomFrom) / (ZOOM_MS / 1000),
        );
        // Ease out cubic: quick push that coasts to a stop rather than
        // arriving at full speed
        const eased = 1 - Math.pow(1 - progress, 3);
        const distance = CAM_START + (CAM_END - CAM_START) * eased;

        camera.position.set(distance, distance, distance);
        camera.lookAt(scene.position);
      }

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    const observer = new ResizeObserver(() => {
      width = mount.clientWidth || 1;
      height = mount.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    observer.observe(mount);

    return () => {
      disposed = true;
      observer.disconnect();
      renderer.setAnimationLoop(null);

      if (mixer) mixer.stopAllAction();
      if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }

      timer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="page-loader__stage" />;
};

export default PageLoader;
