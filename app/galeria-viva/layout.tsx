import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galeria Viva | Momentos Reais de Superação na Bicicleta',
  description:
    'Confira fotos e vídeos reais de alunos adultos, idosos e crianças aprendendo a andar de bicicleta em São Paulo com a ABC do Pedal.',
  alternates: {
    canonical: 'https://www.abcdopedal.com.br/galeria-viva',
  },
  openGraph: {
    title: 'Galeria Viva | ABC do Pedal - Escola de Bicicleta em São Paulo',
    description:
      'Veja momentos reais de superação e conquistas sobre duas rodas de alunos de todas as idades na ABC do Pedal.',
    url: 'https://www.abcdopedal.com.br/galeria-viva',
  },
};

export default function GaleriaVivaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
