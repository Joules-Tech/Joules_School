import Navigation from '../components/Navigation';
import ParticleBackground from '../components/ParticleBackground';
import Footer from '../components/Footer';

export default function TermsPage() {
    return (
        <>
            <ParticleBackground />
            <Navigation />

            <main className="content-layer min-h-screen pt-24 px-6 pb-20">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12 animate-fade-in">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            Terms of <span className="text-gradient">Service</span>
                        </h1>
                        <p className="text-lg text-gray-600">
                            Last updated: February 16, 2026
                        </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 animate-fade-in">
                        <div className="prose prose-lg max-w-none">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
                            <p className="text-gray-700 mb-6">
                                By accessing and using the Joules School Rojmel Management System, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Use License</h2>
                            <p className="text-gray-700 mb-4">
                                Permission is granted to temporarily use our service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                                <li>Modify or copy the materials</li>
                                <li>Use the materials for any commercial purpose</li>
                                <li>Attempt to decompile or reverse engineer any software</li>
                                <li>Remove any copyright or proprietary notations</li>
                                <li>Transfer the materials to another person</li>
                            </ul>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">User Accounts</h2>
                            <p className="text-gray-700 mb-4">
                                When you create an account with us, you must provide accurate and complete information. You are responsible for:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                                <li>Maintaining the security of your account credentials</li>
                                <li>All activities that occur under your account</li>
                                <li>Notifying us immediately of any unauthorized access</li>
                            </ul>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Acceptable Use</h2>
                            <p className="text-gray-700 mb-4">
                                You agree not to use our service to:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                                <li>Violate any applicable laws or regulations</li>
                                <li>Infringe upon the rights of others</li>
                                <li>Transmit any harmful or malicious code</li>
                                <li>Interfere with or disrupt the service</li>
                                <li>Attempt to gain unauthorized access to any systems</li>
                            </ul>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Data and Content</h2>
                            <p className="text-gray-700 mb-6">
                                You retain all rights to the data you input into our system. By using our service, you grant us a license to use, store, and process your data solely for the purpose of providing our services to you.
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Service Availability</h2>
                            <p className="text-gray-700 mb-6">
                                We strive to maintain high availability but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of our service with or without notice.
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Limitation of Liability</h2>
                            <p className="text-gray-700 mb-6">
                                In no event shall Joules Technologies be liable for any damages arising out of the use or inability to use our service, even if we have been notified of the possibility of such damages.
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Termination</h2>
                            <p className="text-gray-700 mb-6">
                                We may terminate or suspend your account immediately, without prior notice, for any breach of these Terms of Service.
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Changes to Terms</h2>
                            <p className="text-gray-700 mb-6">
                                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through our service.
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Contact Information</h2>
                            <p className="text-gray-700">
                                For questions about these Terms of Service, please contact us at{' '}
                                <a href="mailto:legal@joulestechnologies.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                                    legal@joulestechnologies.com
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
