"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const PARTICLE_COUNT = 50;
const COLORS = ['#7E57C2', '#1E3A8A', '#16A34A', '#F0F9FF'];

const ConfettiParticle = ({ id }: { id: number }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const size = Math.random() * 8 + 4;
    const initialX = 50;
    const initialY = 50;

    // Random trajectory
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 80 + 50;
    const finalX = initialX + Math.cos(angle) * velocity;
    const finalY = initialY + Math.sin(angle) * velocity;

    // Random rotation
    const rotation = Math.random() * 360 - 180;
    
    setStyle({
      backgroundColor: color,
      width: `${size}px`,
      height: `${size}px`,
      left: `${initialX}%`,
      top: `${initialY}%`,
      '--final-x': `${finalX}vw`,
      '--final-y': `${finalY}vh`,
      '--rotation': `${rotation}deg`,
      animationDelay: `${Math.random() * 0.2}s`,
    });
  }, [id]);

  return (
    <div
      className={cn(
        'absolute rounded-full opacity-0',
        'animate-[confetti-burst_1s_ease-out_forwards]'
      )}
      style={style}
    >
      <style jsx global>{`
        @keyframes confetti-burst {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(var(--final-x) - 50vw), calc(var(--final-y) - 50vh)) rotate(var(--rotation)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export const Confetti = () => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: PARTICLE_COUNT }, (_, i) => i));
    const timer = setTimeout(() => setParticles([]), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((id) => <ConfettiParticle key={id} id={id} />)}
    </div>
  );
};
