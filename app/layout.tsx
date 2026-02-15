import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Joules School Rojmel',
  description: 'Multi-tenant school rojmel management system - Secure, role-based access for owners, accountants, and viewers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
