'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type DataStreamProps = {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
  speed?: number;
};

export function DataStream({
  from,
  to,
  color = '#22d3ee',
  speed = 0.5,
}: DataStreamProps) {
  const progressRef = useRef(0);

  const points = useMemo(() => {
    const fromV = new THREE.Vector3(...from);
    const toV = new THREE.Vector3(...to);
    const mid = new THREE.Vector3()
      .addVectors(fromV, toV)
      .multiplyScalar(0.5);
    mid.y += 1.5;
    const curve = new THREE.QuadraticBezierCurve3(fromV, mid, toV);
    return curve.getPoints(30);
  }, [from, to]);

  const curveGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  const particleGeo = useRef(new THREE.BufferGeometry());

  useFrame((_, delta) => {
    progressRef.current += delta * speed;
    if (progressRef.current > 1) progressRef.current = 0;

    const idx = Math.floor(progressRef.current * (points.length - 1));
    if (particleGeo.current && idx < points.length) {
      const pos = new Float32Array([
        points[idx].x,
        points[idx].y,
        points[idx].z,
      ]);
      particleGeo.current.setAttribute(
        'position',
        new THREE.BufferAttribute(pos, 3),
      );
    }
  });

  return (
    <group>
      <line>
        <bufferGeometry {...curveGeo} />
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </line>
      <points>
        <bufferGeometry ref={particleGeo} />
        <pointsMaterial
          color={color}
          size={0.08}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
