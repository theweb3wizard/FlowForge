'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 500;
const SPEED_FACTOR = 0.02;

type BlockchainParticlesProps = {
  color?: string;
  count?: number;
};

export function BlockchainParticles({
  color = '#22d3ee',
  count = COUNT,
}: BlockchainParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);
  const { pointer } = useThree();

  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const baseColor = new THREE.Color(color);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 20;
      pos[i3 + 1] = (Math.random() - 0.5) * 15;
      pos[i3 + 2] = (Math.random() - 0.5) * 10 - 5;
      vel[i3] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.01;

      const c = baseColor.clone().lerp(
        new THREE.Color('#a855f7'),
        Math.random(),
      );
      cols[i3] = c.r;
      cols[i3 + 1] = c.g;
      cols[i3 + 2] = c.b;
    }

    return [pos, vel, cols];
  }, [count, color]);

  useFrame(() => {
    if (!meshRef.current) return;
    const pos = meshRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] += velocities[i3] + (pointer.x * 0.005);
      pos[i3 + 1] += velocities[i3 + 1] + (pointer.y * -0.005);
      pos[i3 + 2] += velocities[i3 + 2];

      if (Math.abs(pos[i3]) > 10) velocities[i3] *= -1;
      if (Math.abs(pos[i3 + 1]) > 7.5) velocities[i3 + 1] *= -1;
      if (Math.abs(pos[i3 + 2]) > 5) velocities[i3 + 2] *= -1;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const geomRef = useRef<THREE.BufferGeometry>(null);

  return (
    <points ref={meshRef}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
