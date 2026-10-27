import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const NightCityCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGlError, setHasWebGlError] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let animId: number = 0;
    let isVisible = true;

    try {
      const width = mountRef.current.clientWidth || window.innerWidth;
      const height = mountRef.current.clientHeight || window.innerHeight;

      // 1. Scene & Fog
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x070b14);
      scene.fog = new THREE.FogExp2(0x070b14, 0.015);

      // 2. Camera
      camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
      camera.position.set(0, 45, 90);
      camera.lookAt(0, 5, 0);

      // 3. Renderer with performance caps
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      mountRef.current.appendChild(renderer.domElement);

      // 4. Lighting
      const ambientLight = new THREE.AmbientLight(0x151d30, 1.5);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0x3b82f6, 1.2);
      dirLight.position.set(30, 60, 40);
      scene.add(dirLight);

      // 5. Ground Plane with Grid
      const groundGeo = new THREE.PlaneGeometry(300, 300, 40, 40);
      const groundMat = new THREE.MeshBasicMaterial({
        color: 0x0a0e17,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      // 6. Procedural Buildings using InstancedMesh (~150 buildings)
      const buildingCount = 150;
      const boxGeo = new THREE.BoxGeometry(1, 1, 1);
      const buildingMat = new THREE.MeshLambertMaterial({
        color: 0x111827,
      });

      const instancedMesh = new THREE.InstancedMesh(boxGeo, buildingMat, buildingCount);
      const dummy = new THREE.Object3D();
      const colors = [0x3b82f6, 0x2dd4bf, 0xf59e0b, 0xa78bfa, 0x1f2937];

      let seed = 42;
      const pseudoRandom = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      for (let i = 0; i < buildingCount; i++) {
        const x = (pseudoRandom() - 0.5) * 140;
        const z = (pseudoRandom() - 0.5) * 140;

        // Leave city center clear for primary incident beacon
        if (Math.hypot(x, z) < 18) continue;

        const width = 3 + pseudoRandom() * 4;
        const depth = 3 + pseudoRandom() * 4;
        const bHeight = 6 + pseudoRandom() * 26;

        dummy.position.set(x, bHeight / 2, z);
        dummy.scale.set(width, bHeight, depth);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(i, dummy.matrix);

        // Accent emissive colors on ~25% of buildings
        const col = new THREE.Color(pseudoRandom() > 0.75 ? colors[Math.floor(pseudoRandom() * colors.length)] : 0x0f1626);
        instancedMesh.setColorAt(i, col);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
      scene.add(instancedMesh);

      // 7. Glowing Incident Beacons (Center of City)
      const beaconGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, 3, 0);
      scene.add(beacon);

      // Beacon Light
      const beaconLight = new THREE.PointLight(0x3b82f6, 4, 40);
      beaconLight.position.set(0, 4, 0);
      scene.add(beaconLight);

      // Pulsing Ring around primary incident
      const ringGeo = new THREE.RingGeometry(2, 2.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.2;
      scene.add(ring);

      // Secondary beacons
      const secPositions = [[-25, 1, 15], [30, 1, -20], [-15, 1, -30], [22, 1, 28]];
      secPositions.forEach(([bx, by, bz], idx) => {
        const sGeo = new THREE.SphereGeometry(0.8, 12, 12);
        const sColor = idx % 2 === 0 ? 0x2dd4bf : 0xf43f5e;
        const sMat = new THREE.MeshBasicMaterial({ color: sColor });
        const sMesh = new THREE.Mesh(sGeo, sMat);
        sMesh.position.set(bx, by + 1, bz);
        scene?.add(sMesh);

        const sLight = new THREE.PointLight(sColor, 2, 20);
        sLight.position.set(bx, by + 2, bz);
        scene?.add(sLight);
      });

      // 8. Animation & Camera Flight
      let clock = new THREE.Clock();

      const animate = () => {
        if (!renderer || !scene || !camera) return;
        animId = requestAnimationFrame(animate);

        if (!isVisible) return;

        const elapsedTime = clock.getElapsedTime();

        // Slow camera orbital path
        const angle = elapsedTime * 0.08;
        camera.position.x = Math.sin(angle) * 75;
        camera.position.z = Math.cos(angle) * 75;
        camera.position.y = 40 + Math.sin(elapsedTime * 0.2) * 5;
        camera.lookAt(0, 5, 0);

        // Pulsing ring animation
        const pulse = (Math.sin(elapsedTime * 3) + 1) / 2;
        ring.scale.set(1 + pulse * 1.8, 1 + pulse * 1.8, 1);
        ringMat.opacity = 0.8 - pulse * 0.6;

        renderer.render(scene, camera);
      };

      animate();

      // Visibility & Resize Listeners
      const handleResize = () => {
        if (!mountRef.current || !renderer || !camera) return;
        const newW = mountRef.current.clientWidth;
        const newH = mountRef.current.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };

      const handleVisibilityChange = () => {
        isVisible = document.visibilityState === 'visible';
      };

      window.addEventListener('resize', handleResize);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('visibilitychange', handleVisibilityChange);

        if (renderer && renderer.domElement && mountRef.current) {
          mountRef.current.removeChild(renderer.domElement);
          renderer.dispose();
        }
        groundGeo.dispose();
        groundMat.dispose();
        boxGeo.dispose();
        buildingMat.dispose();
        beaconGeo.dispose();
        beaconMat.dispose();
        ringGeo.dispose();
        ringMat.dispose();
      };
    } catch (err) {
      console.warn('WebGL initialization failed, using static fallback:', err);
      setHasWebGlError(true);
    }
  }, []);

  if (hasWebGlError) {
    // Elegant CSS/SVG Fallback
    return (
      <div className="absolute inset-0 bg-night flex items-center justify-center overflow-hidden pointer-events-none opacity-40">
        <div className="w-[600px] h-[600px] rounded-full bg-radial from-civic-blue/20 via-agent-violet/10 to-transparent blur-3xl animate-pulse" />
        <div className="absolute inset-0 grid-lines opacity-30" />
      </div>
    );
  }

  return (
    <div ref={mountRef} className="absolute inset-0 pointer-events-none opacity-60 z-0 overflow-hidden" />
  );
};
