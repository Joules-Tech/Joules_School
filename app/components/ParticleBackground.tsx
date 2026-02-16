'use client';

import { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    baseVx: number;
    baseVy: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    element: HTMLDivElement;
}

export default function ParticleBackground() {
    const containerRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mouseRef = useRef({ x: -1000, y: -1000 }); // Start off-screen
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const particleCount = 60;
        const colors = ['#4285f4', '#ea4335', '#fbbc04', '#34a853'];
        const particles: Particle[] = [];

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle-interactive';

            const size = 2 + Math.random() * 4;
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            const color = colors[Math.floor(Math.random() * colors.length)];

            // Random base velocity for continuous movement
            const baseVx = (Math.random() - 0.5) * 0.8;
            const baseVy = (Math.random() - 0.5) * 0.8;

            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = color;
            particle.style.boxShadow = `0 0 ${size * 3}px ${color}`;
            particle.style.position = 'absolute';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.opacity = '0.6';
            particle.style.transition = 'opacity 0.3s ease';

            container.appendChild(particle);

            particles.push({
                x,
                y,
                baseVx,
                baseVy,
                vx: baseVx,
                vy: baseVy,
                size,
                color,
                element: particle,
            });
        }

        particlesRef.current = particles;

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        // Animation loop
        const animate = () => {
            const mouse = mouseRef.current;

            particles.forEach((particle) => {
                // Calculate distance from mouse
                const dx = mouse.x - particle.x;
                const dy = mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const interactionRadius = 120;

                // Only affect particles near the mouse
                if (distance < interactionRadius && distance > 0) {
                    const force = (interactionRadius - distance) / interactionRadius;
                    const angle = Math.atan2(dy, dx);

                    // Push particle away from mouse
                    particle.vx -= Math.cos(angle) * force * 1.2;
                    particle.vy -= Math.sin(angle) * force * 1.2;

                    // Brighten particle when mouse is near
                    particle.element.style.opacity = '1';
                } else {
                    // Return to normal opacity
                    particle.element.style.opacity = '0.6';

                    // Gradually return to base velocity for natural movement
                    particle.vx += (particle.baseVx - particle.vx) * 0.05;
                    particle.vy += (particle.baseVy - particle.vy) * 0.05;
                }

                // Apply damping
                particle.vx *= 0.98;
                particle.vy *= 0.98;

                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Bounce off edges
                if (particle.x <= 0 || particle.x >= window.innerWidth) {
                    particle.vx *= -1;
                    particle.baseVx *= -1;
                    particle.x = Math.max(0, Math.min(window.innerWidth, particle.x));
                }
                if (particle.y <= 0 || particle.y >= window.innerHeight) {
                    particle.vy *= -1;
                    particle.baseVy *= -1;
                    particle.y = Math.max(0, Math.min(window.innerHeight, particle.y));
                }

                // Update DOM
                particle.element.style.left = `${particle.x}px`;
                particle.element.style.top = `${particle.y}px`;
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', handleMouseMove);
        animate();

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            container.innerHTML = '';
        };
    }, []);

    return <div ref={containerRef} className="particle-background" />;
}
