"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function StarSphere() {
  const groupRef = useRef<THREE.Group>(null);

  // Generate a thick volumetric shell of stars
  const particlesCount = 5000;

  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    const innerRadius = 20; // Empty space in the very center
    const outerRadius = 80; // Outer edge of the star shell

    for (let i = 0; i < particlesCount; i++) {
      // Uniform distribution inside a spherical volume between inner and outer radius
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      const r = Math.cbrt(
        Math.random() * (Math.pow(outerRadius, 3) - Math.pow(innerRadius, 3)) + Math.pow(innerRadius, 3)
      );

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Slowly rotate the entire volume around its persistent world axis (not the camera axis)
      groupRef.current.rotation.y += delta * 0.015;
      groupRef.current.rotation.x += delta * 0.005;
      groupRef.current.rotation.z += delta * 0.002;
    }
  });

  return (
    // We offset the sphere deeply into the Z axis.
    // By pushing it to z=-60, the camera looks at the face of the sphere.
    // As it rotates on its Y axis, the front face moves left, and the back face moves right.
    <group ref={groupRef} position={[0, 0, -60]}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        {/* sizeAttenuation ensures closer stars render much larger than distant ones */}
        <pointsMaterial
          size={0.15}
          color="#ffffff"
          transparent
          opacity={0.7}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function Starfield() {
  return (
    <div className="fixed inset-0 -z-10 bg-black pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        {/* Fog dynamically dims stars as they recede into the back of the sphere */}
        <fog attach="fog" args={["#000000", 25, 120]} />
        <StarSphere />
      </Canvas>
    </div>
  );
}
