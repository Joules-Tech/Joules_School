import Navigation from '../components/Navigation';
import ParticleBackground from '../components/ParticleBackground';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <>
            <ParticleBackground />
            <Navigation />

            <main className="content-layer min-h-screen pt-24 px-6 pb-20">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16 animate-fade-in">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            About <span className="text-gradient">Joules Technologies</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Empowering schools with innovative digital solutions for efficient management and record keeping.
                        </p>
                    </div>

                    {/* Mission Section */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 mb-8 animate-fade-in">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
                        <p className="text-lg text-gray-700 leading-relaxed mb-4">
                            At Joules Technologies, we believe in transforming education through technology. Our mission is to provide schools with powerful, easy-to-use tools that streamline administrative tasks and enhance the educational experience.
                        </p>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            We're committed to building solutions that are secure, scalable, and designed specifically for the unique needs of educational institutions across India.
                        </p>
                    </div>

                    {/* Values */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6 animate-fade-in">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Security First</h3>
                            <p className="text-gray-600">
                                Your data security is our top priority. We implement industry-leading security practices.
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Innovation</h3>
                            <p className="text-gray-600">
                                Continuously improving our platform with cutting-edge technology and user feedback.
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">User-Centric</h3>
                            <p className="text-gray-600">
                                Designed with educators in mind, ensuring intuitive and efficient workflows.
                            </p>
                        </div>
                    </div>

                    {/* Team Section */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 animate-fade-in">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Team</h2>
                        <p className="text-lg text-gray-700 leading-relaxed text-center max-w-2xl mx-auto">
                            We're a passionate team of developers, designers, and education enthusiasts dedicated to making school management simpler and more efficient. Based in India, we understand the unique challenges faced by educational institutions and build solutions tailored to address them.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
