'use client';

import { Canvas, type CanvasProps } from '@react-three/fiber';
import { Environment } from '@react-three/drei';

type Scene3DProps = CanvasProps & {
  withEffects?: boolean;
};

export function Scene3D({ children, withEffects = true, ...props }: Scene3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 60, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      {...props}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#a855f7" />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#22d3ee" />

      <Environment preset="city" />

      {children}
    </Canvas>
  );
}
