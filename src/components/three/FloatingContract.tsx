'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';

type FloatingContractProps = {
  position: [number, number, number];
  color?: string;
  label?: string;
  size?: number;
  type?: 'octahedron' | 'dodecahedron' | 'icosahedron';
};

const GEOMETRIES = {
  octahedron: new THREE.OctahedronGeometry(1, 0),
  dodecahedron: new THREE.DodecahedronGeometry(1, 0),
  icosahedron: new THREE.IcosahedronGeometry(1, 0),
};

export function FloatingContract({
  position,
  color = '#22d3ee',
  label,
  size = 0.8,
  type = 'octahedron',
}: FloatingContractProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);

  const baseGeo = useMemo(() => {
    const geo = GEOMETRIES[type].clone();
    geo.scale(size, size, size);
    return geo;
  }, [type, size]);

  const wireframeGeo = useMemo(() => {
    const geo = baseGeo.clone();
    return geo;
  }, [baseGeo]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
    if (wireframeRef.current) {
      wireframeRef.current.rotation.x += delta * 0.2;
      wireframeRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group position={position}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <mesh ref={meshRef} geometry={baseGeo}>
          <meshPhysicalMaterial
            color={color}
            metalness={0.7}
            roughness={0.2}
            transparent
            opacity={0.85}
            envMapIntensity={1.5}
          />
        </mesh>
        <mesh ref={wireframeRef} geometry={wireframeGeo} scale={1.02}>
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      </Float>
      {label && (
        <Text
          position={[0, -size - 0.5, 0]}
          fontSize={0.25}
          color="#94a3b8"
          anchorX="center"
          anchorY="top"
          maxWidth={2}
        >
          {label}
        </Text>
      )}
    </group>
  );
}
