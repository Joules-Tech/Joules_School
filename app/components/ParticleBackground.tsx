'use client';

import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const particleCount = 50;

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            // Random starting position
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;

            // Random animation duration (slower = more elegant)
            const duration = 15 + Math.random() * 20; // 15-35 seconds

            // Random delay for staggered effect
            const delay = Math.random() * 10;

            // Random horizontal drift
            const drift = (Math.random() - 0.5) * 200;

            particle.style.left = `${startX}%`;
            particle.style.top = `${startY}%`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.setProperty('--drift', `${drift}px`);

            container.appendChild(particle);
        }

        // Cleanup
        return () => {
            container.innerHTML = '';
        };
    }, []);

    return <div ref={containerRef} className="particle-background" />;
}
