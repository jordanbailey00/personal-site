"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLES_COUNT = 5000;

function createStarPositions() {
  const pos = new Float32Array(PARTICLES_COUNT * 3);
  const innerRadius = 20;
  const outerRadius = 80;

  for (let i = 0; i < PARTICLES_COUNT; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(
      Math.random() * (Math.pow(outerRadius, 3) - Math.pow(innerRadius, 3)) + Math.pow(innerRadius, 3)
    );

    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }

  return pos;
}

const STAR_POSITIONS = createStarPositions();

function StarSphere() {
  const groupRef = useRef<THREE.Group>(null);

  const positions = STAR_POSITIONS;

  useFrame((_, delta) => {
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
          onBeforeCompile={(shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              `#include <clipping_planes_fragment>`,
              `
              vec2 cxy = 2.0 * gl_PointCoord - 1.0;
              float r = dot(cxy, cxy);
              if (r > 1.0) discard;
              #include <clipping_planes_fragment>
              `
            );
          }}
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
