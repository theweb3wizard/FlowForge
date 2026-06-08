'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const CHAINS = [
  { id: 1, name: 'Ethereum', shortName: 'ETH', color: '#627eea' },
  { id: 11155111, name: 'Sepolia', shortName: 'SEP', color: '#f59e0b' },
  { id: 8453, name: 'Base', shortName: 'BASE', color: '#0052ff' },
  { id: 84532, name: 'Base Sepolia', shortName: 'BSEP', color: '#0052ff' },
  { id: 137, name: 'Polygon', shortName: 'MATIC', color: '#8247e5' },
  { id: 42161, name: 'Arbitrum', shortName: 'ARB', color: '#2d374b' },
  { id: 10, name: 'Optimism', shortName: 'OP', color: '#ff0420' },
  { id: 56, name: 'BNB Chain', shortName: 'BSC', color: '#f0b90b' },
  { id: 1043, name: 'BlockDAG', shortName: 'BDAG', color: '#22d3ee' },
];

type ChainNodesProps = {
  radius?: number;
};

export function ChainNodes({ radius = 4.5 }: ChainNodesProps) {
  const groupRef = useRef<THREE.Group>(null);

  const nodes = useMemo(() => {
    return CHAINS.map((chain, i) => {
      const angle = (i / CHAINS.length) * Math.PI * 2 - Math.PI / 2;
      return {
        ...chain,
        angle,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.5,
        z: Math.sin(angle) * radius * 0.3,
      };
    });
  }, [radius]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node) => (
        <NodeSphere key={node.id} node={node} />
      ))}
      {nodes.map((node, i) => {
        const next = nodes[(i + 1) % nodes.length];
        return (
          <LineBetween
            key={`line-${node.id}`}
            from={[node.x, node.y, node.z]}
            to={[next.x, next.y, next.z]}
            color={node.color}
          />
        );
      })}
    </group>
  );
}

type ChainNode = {
  id: number;
  name: string;
  shortName: string;
  color: string;
  angle: number;
  x: number;
  y: number;
  z: number;
};

function NodeSphere({ node }: { node: ChainNode }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.002 + node.angle) * 0.08);
    }
  });

  return (
    <group position={[node.x, node.y, node.z]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={node.color} />
      </mesh>
      <mesh scale={[0.5, 0.5, 0.5]} position={[0, -0.4, 0]}>
        <planeGeometry />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.15}
        color="#94a3b8"
        anchorX="center"
        anchorY="top"
      >
        {node.shortName}
      </Text>
    </group>
  );
}

function LineBetween({
  from,
  to,
  color,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [midpoint, length, direction] = useMemo(() => {
    const fromV = new THREE.Vector3(...from);
    const toV = new THREE.Vector3(...to);
    const mid = new THREE.Vector3().addVectors(fromV, toV).multiplyScalar(0.5);
    const len = fromV.distanceTo(toV);
    const dir = new THREE.Vector3().subVectors(toV, fromV).normalize();
    return [mid, len, dir];
  }, [from, to]);

  useFrame(() => {
    if (ref.current) {
      ref.current.lookAt(new THREE.Vector3(...to));
    }
  });

  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    direction
  );
  const euler = new THREE.Euler().setFromQuaternion(quaternion);

  return (
    <mesh
      ref={ref}
      position={midpoint}
      rotation={euler}
    >
      <cylinderGeometry args={[0.008, 0.008, length, 4]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
}
