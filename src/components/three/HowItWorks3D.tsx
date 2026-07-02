'use client';

import { Suspense, useState } from 'react';
import { Scene3D } from '@/components/three/Scene3D';
import { BlockchainParticles } from '@/components/three/BlockchainParticles';
import { FloatingContract } from '@/components/three/FloatingContract';
import { ChainNodes } from '@/components/three/ChainNodes';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Wallet, Layers, Link2, Play } from 'lucide-react';

type SceneState = 'connect' | 'build' | 'variables' | 'execute';

const SCENE_INFO: Record<SceneState, {
  title: string;
  description: string;
  icon: typeof Wallet;
}> = {
  connect: {
    title: '1. Connect Your Wallet',
    description: 'Sign in with any EVM wallet — MetaMask, Phantom, Rabby, or any wagmi-compatible browser wallet. No email, no sign-up form.',
    icon: Wallet,
  },
  build: {
    title: '2. Build a Recipe',
    description: 'Add deployment and interaction steps in any order. Upload ABIs, set constructor params, drag to reorder. Everything lives in your browser.',
    icon: Layers,
  },
  variables: {
    title: '3. Wire Variables Together',
    description: 'Reference any previous step\'s contract address or transaction hash. Token deployed in step 1? Use its address in step 3\'s constructor — automatically.',
    icon: Link2,
  },
  execute: {
    title: '4. Execute on Any Chain',
    description: 'Pick your target chain, click run, approve each transaction in your wallet. Results persist instantly. If something fails mid-run, you keep what deployed.',
    icon: Play,
  },
};

const SCENE_ORDER: SceneState[] = ['connect', 'build', 'variables', 'execute'];

export function HowItWorks3D() {
  const [currentScene, setCurrentScene] = useState<SceneState>('connect');
  const currentIdx = SCENE_ORDER.indexOf(currentScene);
  const info = SCENE_INFO[currentScene];
  const Icon = info.icon;

  const goNext = () => {
    if (currentIdx < SCENE_ORDER.length - 1) {
      setCurrentScene(SCENE_ORDER[currentIdx + 1]);
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) {
      setCurrentScene(SCENE_ORDER[currentIdx - 1]);
    }
  };

  return (
    <div className="relative grid min-h-[600px] overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-2">
      <div className="relative z-10 flex flex-col justify-between p-8 lg:p-12">
        <div className="space-y-6">
          <div className="flex gap-2">
            {SCENE_ORDER.map((scene, i) => (
              <button
                key={scene}
                onClick={() => setCurrentScene(scene)}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i <= currentIdx
                    ? 'bg-primary'
                    : 'bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Icon className="h-3 w-3" />
              Step {currentIdx + 1} of {SCENE_ORDER.length}
            </div>
            <h3 className="text-2xl font-semibold tracking-tight">
              {info.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {info.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          {currentIdx < SCENE_ORDER.length - 1 ? (
            <Button size="sm" onClick={goNext} className="gap-1.5">
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" asChild className="gap-1.5">
              <a href="/sign-in">
                Start Building
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="relative h-full min-h-[400px]">
        <Scene3D
          camera={{ position: [0, 1, 8], fov: 50, near: 0.1, far: 100 }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 5, 5]} intensity={0.6} />
            <BlockchainParticles color="#22d3ee" count={200} />

            {currentScene === 'connect' && (
              <FloatingContract
                position={[0, 0, 0]}
                color="#22d3ee"
                label="Wallet"
                type="dodecahedron"
                size={1.2}
              />
            )}

            {currentScene === 'build' && (
              <>
                <FloatingContract
                  position={[-2, 0.5, 0]}
                  color="#f59e0b"
                  label="Step 1: Deploy"
                  type="octahedron"
                  size={0.7}
                />
                <FloatingContract
                  position={[0, -0.3, 0]}
                  color="#22d3ee"
                  label="Step 2: Interact"
                  type="dodecahedron"
                  size={0.7}
                />
                <FloatingContract
                  position={[2, 0.8, 0.5]}
                  color="#a855f7"
                  label="Step 3: Deploy"
                  type="icosahedron"
                  size={0.7}
                />
              </>
            )}

            {currentScene === 'variables' && (
              <>
                <FloatingContract
                  position={[-2.5, 0, 0]}
                  color="#f59e0b"
                  label="Token.sol"
                  type="octahedron"
                  size={0.8}
                />
                <FloatingContract
                  position={[2.5, 0, 0]}
                  color="#22d3ee"
                  label="Staking.sol"
                  type="icosahedron"
                  size={0.8}
                />
                <line>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={2}
                      array={new Float32Array([-1.7, 0, 0, 1.7, 0, 0])}
                      itemSize={3}
                      args={[new Float32Array([-1.7, 0, 0, 1.7, 0, 0]), 3]}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial color="#22d3ee" transparent opacity={0.3} />
                </line>
              </>
            )}

            {currentScene === 'execute' && (
              <>
                <ChainNodes radius={4} />
                <FloatingContract
                  position={[0, -1.5, 0]}
                  color="#22d3ee"
                  label="Execute"
                  type="dodecahedron"
                  size={0.6}
                />
              </>
            )}
          </Suspense>
        </Scene3D>
      </div>
    </div>
  );
}
