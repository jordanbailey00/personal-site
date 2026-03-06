"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Stars() {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate random star positions
  const particlesCount = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      // Create a sphere of stars
      const distance = 10 + Math.random() * 40; // 10 to 50 radius
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);

      const x = distance * Math.sin(theta) * Math.cos(phi);
      const y = distance * Math.sin(theta) * Math.sin(phi);
      const z = distance * Math.cos(theta);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  // Rotate the entire starfield slowly
  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
      pointsRef.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation={true}
      />
    </points>
  );
}

export default function Starfield() {
  return (
    <div className="fixed inset-0 -z-10 bg-black pointer-events-none">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <fog attach="fog" args={["#000000", 10, 50]} />
        <Stars />
      </Canvas>
    </div>
  );
}
