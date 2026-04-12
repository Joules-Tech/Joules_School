import './globals.css'
import type { Metadata } from 'next'
import { Noto_Sans, Noto_Sans_Gujarati } from 'next/font/google'

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
})

const notoGujarati = Noto_Sans_Gujarati({
  subsets: ['gujarati'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-gujarati',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Joules School Rojmel',
  description:
    'Multi-tenant school rojmel management system — Secure, role-based access for GSEB schools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${notoSans.variable} ${notoGujarati.variable}`}>
      <body
        className="min-h-screen"
        style={{ fontFamily: 'var(--font-noto-gujarati), var(--font-noto-sans), sans-serif' }}
      >
        {children}
      </body>
    </html>
  )
}
