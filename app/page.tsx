import Link from 'next/link';
import Navigation from './components/Navigation';
import ParticleBackground from './components/ParticleBackground';
import Footer from './components/Footer';

export default function HomePage() {
  return (
    <>
      {/* Particle Background Effect */}
      <ParticleBackground />

      {/* Navigation Bar */}
      <Navigation />

      {/* Main Content */}
      <main className="content-layer min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="max-w-5xl mx-auto text-center">{/* Hero Section */}
          {/* Hero Section */}
          <div className="space-y-8 animate-fade-in">
            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 leading-tight">
              School Rojmel
              <br />
              <span className="text-gradient">Made Simple</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
              Multi-tenant rojmel and cashbook management for schools.
              <br />
              Secure, role-based access for owners, accountants, and viewers.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link
                href="/auth/signup"
                className="btn-primary w-full sm:w-auto min-w-[180px]"
              >
                Get Started
              </Link>
              <Link
                href="/auth/login"
                className="btn-secondary w-full sm:w-auto min-w-[180px]"
              >
                Login
              </Link>
            </div>

            {/* Trust Badge */}
            <div className="pt-12 opacity-70">
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
                Trusted by schools across India
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Access</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Role-based permissions ensure data security and privacy
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Updates</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Track your school's finances with live data synchronization
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Optimized performance for smooth and efficient workflows
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
