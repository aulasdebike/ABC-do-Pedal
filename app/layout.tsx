import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { localBusinessSchema, serviceSchema, faqSchema } from '@/lib/seo-schema';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#ff007f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.abcdopedal.com.br'),
  title: {
    default: 'ABC do Pedal | Aulas para Aprender a Andar de Bicicleta em São Paulo',
    template: '%s | ABC do Pedal',
  },
  description:
    'Escola de bicicleta em São Paulo especializada em ensinar adultos, idosos e crianças a pedalar do zero. Aulas particulares no Parque Ibirapuera e a domicílio.',
  keywords: [
    'aprender a andar de bicicleta em são paulo',
    'aula para aprender a pedalar em são paulo',
    'aula de bicicleta para adultos',
    'aula de bicicleta para idosos',
    'aula de bicicleta para crianças',
    'aprender a pedalar no parque ibirapuera',
    'professor para aprender a andar de bicicleta',
    'aula particular de bicicleta sp',
    'escola de bicicleta são paulo',
    'abc do pedal',
  ],
  authors: [{ name: 'ABC do Pedal' }],
  creator: 'ABC do Pedal',
  publisher: 'ABC do Pedal',
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: 'https://www.abcdopedal.com.br',
  },
  openGraph: {
    title: 'ABC do Pedal | Aulas para Aprender a Andar de Bicicleta em São Paulo',
    description:
      'Aprenda a pedalar do zero com segurança, acolhimento e método estruturado. Aulas no Parque Ibirapuera e atendimento a domicílio na Grande São Paulo.',
    url: 'https://www.abcdopedal.com.br',
    siteName: 'ABC do Pedal',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ABC do Pedal - Aulas para Aprender a Andar de Bicicleta em São Paulo',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ABC do Pedal | Aulas para Aprender a Andar de Bicicleta em São Paulo',
    description:
      'Aulas particulares para adultos, idosos e crianças aprenderem a pedalar do zero com segurança no Parque Ibirapuera e Grande SP.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        {/* Schema.org Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans antialiased bg-[#0a0a0c] text-slate-100 selection:bg-pink-500 selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
