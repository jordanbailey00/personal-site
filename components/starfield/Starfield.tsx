"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface StarLayerProps {
  count: number;
  radius: number;
  size: number;
  speed: number;
  opacity: number;
}

function StarLayer({ count, radius, size, speed, opacity }: StarLayerProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Distribute points uniformly inside a sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = radius * Math.cbrt(Math.random());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, [count, radius]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      // Apply slight rotation to create parallax
      pointsRef.current.rotation.y -= delta * speed;
      pointsRef.current.rotation.x -= delta * (speed * 0.2);
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
        size={size}
        color="#ffffff"
        transparent
        opacity={opacity}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
}

export default function Starfield() {
  return (
    <div className="fixed inset-0 -z-10 bg-black pointer-events-none">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <fog attach="fog" args={["#000000", 15, 60]} />
        {/* Render 3 distinct layers to force deep parallax */}
        {/* Background: Lots of faint, tiny, slow stars */}
        <StarLayer count={3000} radius={70} size={0.02} speed={0.002} opacity={0.3} />
        {/* Midground: Medium amount, medium size, medium speed */}
        <StarLayer count={1500} radius={45} size={0.04} speed={0.005} opacity={0.5} />
        {/* Foreground: Fewer, larger, faster stars */}
        <StarLayer count={600} radius={25} size={0.08} speed={0.012} opacity={0.8} />
      </Canvas>
    </div>
  );
}
