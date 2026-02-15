'use client';

import ParticleBackground from './ParticleBackground';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* Particle Background */}
            <ParticleBackground />

            {/* Auth Container */}
            <div className="content-layer min-h-screen flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Logo/Brand */}
                    <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-2xl">J</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                            Joules School
                        </span>
                    </Link>

                    {/* Auth Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-10 animate-fade-in">
                        {children}
                    </div>

                    {/* Back to Home */}
                    <div className="text-center mt-6">
                        <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
