import Navigation from '../components/Navigation';
import ParticleBackground from '../components/ParticleBackground';
import Footer from '../components/Footer';
import Link from 'next/link';

export default function SupportPage() {
    const faqs = [
        {
            question: 'How do I create a school account?',
            answer: 'After signing up, navigate to the "Register School" page from your dashboard. Fill in your school details including name, address, and initial cash/bank balances.',
        },
        {
            question: 'What are the different user roles?',
            answer: 'There are three roles: Owner (full access), Accountant (can add/edit entries), and Viewer (read-only access). Roles are assigned when users are added to a school.',
        },
        {
            question: 'How do I add rojmel entries?',
            answer: 'Go to the Rojmel page and click "Add Entry". Select the entry type (IN/OUT), payment mode (CASH/BANK/UPI), amount, and description.',
        },
        {
            question: 'Can I export my data?',
            answer: 'Yes! You can export your rojmel data in CSV or PDF format from the Rojmel page. This is useful for record-keeping and audits.',
        },
        {
            question: 'Is my financial data secure?',
            answer: 'Absolutely. We use bank-level encryption, secure authentication, and role-based access control. Your data is backed up daily and stored securely.',
        },
        {
            question: 'How do I reset my password?',
            answer: 'Click "Forgot Password" on the login page. You\'ll receive an email with instructions to reset your password securely.',
        },
    ];

    return (
        <>
            <ParticleBackground />
            <Navigation />

            <main className="content-layer min-h-screen pt-24 px-6 pb-20">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16 animate-fade-in">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            How Can We <span className="text-gradient">Help?</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Find answers to common questions or get in touch with our support team.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        <Link href="/contact" className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 animate-fade-in group">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Support</h3>
                            <p className="text-gray-600 text-sm">Get help via email within 24 hours</p>
                        </Link>

                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Documentation</h3>
                            <p className="text-gray-600 text-sm">Browse our comprehensive guides</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Live Chat</h3>
                            <p className="text-gray-600 text-sm">Chat with us during business hours</p>
                        </div>
                    </div>

                    {/* FAQs */}
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6 animate-fade-in"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact CTA */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl shadow-xl p-8 md:p-12 text-center text-white animate-fade-in">
                        <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
                        <p className="text-lg mb-6 opacity-90">
                            Our support team is here to help. Reach out and we'll get back to you as soon as possible.
                        </p>
                        <Link href="/contact" className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors">
                            Contact Support
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
