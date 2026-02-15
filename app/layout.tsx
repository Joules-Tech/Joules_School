import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Joules School Rojmel',
  description: 'Multi-tenant school rojmel management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-[#FFB199] via-[#FF7E9D] to-[#9C43A6] text-gray-900">
        <div className="flex min-h-screen items-center justify-center px-4 py-6">
          <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white/80 shadow-xl backdrop-blur-lg">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
