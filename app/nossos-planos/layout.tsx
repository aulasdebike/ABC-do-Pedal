import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Planos e Valores de Aulas de Bicicleta em São Paulo',
  description:
    'Conheça nossos planos de aulas particulares para aprender a andar de bicicleta do zero. Atendimento no Parque Ibirapuera e a domicílio na Grande SP.',
  alternates: {
    canonical: 'https://www.abcdopedal.com.br/nossos-planos',
  },
  openGraph: {
    title: 'Planos e Valores | ABC do Pedal - Aulas de Bicicleta em São Paulo',
    description:
      'Planos de aulas particulares com bicicleta e equipamentos inclusos. Aprenda a pedalar com segurança.',
    url: 'https://www.abcdopedal.com.br/nossos-planos',
  },
};

export default function NossosPlanosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
