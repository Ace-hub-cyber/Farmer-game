import type { Metadata } from 'next'
import { Press_Start_2P } from 'next/font/google'
import './globals.css'

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-psp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LADANG — Pixel Farm Life',
  description: 'Game farming pixel art: bertani, memancing, memasak, dan bangun ladangmu hari demi hari.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={pressStart2P.variable}>
      <body>{children}</body>
    </html>
  )
}
