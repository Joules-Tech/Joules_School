import Navigation from '../components/Navigation';
import ParticleBackground from '../components/ParticleBackground';
import Footer from '../components/Footer';

export default function PrivacyPage() {
    return (
        <>
            <ParticleBackground />
            <Navigation />

            <main className="content-layer min-h-screen pt-24 px-6 pb-20">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12 animate-fade-in">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            Privacy <span className="text-gradient">Policy</span>
                        </h1>
                        <p className="text-lg text-gray-600">
                            Last updated: February 16, 2026
                        </p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 animate-fade-in">
                        <div className="prose prose-lg max-w-none">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                            <p className="text-gray-700 mb-6">
                                At Joules Technologies, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Rojmel School Management System.
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Information We Collect</h2>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
                            <p className="text-gray-700 mb-4">
                                We collect information that you provide directly to us, including:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                                <li>Name and contact information</li>
                                <li>Email address and phone number</li>
                                <li>School affiliation and role</li>
                                <li>Financial transaction data for rojmel entries</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatically Collected Information</h3>
                            <p className="text-gray-700 mb-4">
                                When you access our services, we automatically collect:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                                <li>Log data and usage information</li>
                                <li>Device information and IP address</li>
                                <li>Cookies and similar tracking technologies</li>
                            </ul>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">How We Use Your Information</h2>
                            <p className="text-gray-700 mb-4">
                                We use the collected information for:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                                <li>Providing and maintaining our services</li>
                                <li>Processing transactions and managing accounts</li>
                                <li>Sending administrative information and updates</li>
                                <li>Improving our platform and user experience</li>
                                <li>Ensuring security and preventing fraud</li>
                            </ul>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Data Security</h2>
                            <p className="text-gray-700 mb-6">
                                We implement industry-standard security measures to protect your personal information. This includes encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure.
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Data Sharing</h2>
                            <p className="text-gray-700 mb-6">
                                We do not sell your personal information. We may share your information only with:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                                <li>Service providers who assist in our operations</li>
                                <li>Legal authorities when required by law</li>
                                <li>Other users within your school organization (based on permissions)</li>
                            </ul>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Your Rights</h2>
                            <p className="text-gray-700 mb-4">
                                You have the right to:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
                                <li>Access and update your personal information</li>
                                <li>Request deletion of your data</li>
                                <li>Opt-out of marketing communications</li>
                                <li>Export your data in a portable format</li>
                            </ul>

                            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Contact Us</h2>
                            <p className="text-gray-700">
                                If you have questions about this Privacy Policy, please contact us at{' '}
                                <a href="mailto:privacy@joulestechnologies.com" className="text-blue-600 hover:text-blue-700 font-semibold">
                                    privacy@joulestechnologies.com
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
