'use client';

import { Suspense } from 'react';
import { Scene3D } from '@/components/three/Scene3D';
import { BlockchainParticles } from '@/components/three/BlockchainParticles';
import { FloatingContract } from '@/components/three/FloatingContract';
import { ChainNodes } from '@/components/three/ChainNodes';

export function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10">
      <Scene3D
        camera={{ position: [0, 1, 10], fov: 50, near: 0.1, far: 100 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} />
          <directionalLight position={[-5, -5, -5]} intensity={0.2} color="#a855f7" />

          <BlockchainParticles color="#22d3ee" count={300} />
          <ChainNodes radius={5} />

          <FloatingContract
            position={[-3, 0.5, 1]}
            color="#f59e0b"
            label="Deploy"
            type="octahedron"
            size={0.7}
          />
          <FloatingContract
            position={[0, -0.5, 0]}
            color="#22d3ee"
            label="Interact"
            type="dodecahedron"
            size={0.9}
          />
          <FloatingContract
            position={[3, 0.8, 1.5]}
            color="#a855f7"
            label="Execute"
            type="icosahedron"
            size={0.7}
          />
        </Suspense>
      </Scene3D>
    </div>
  );
}
