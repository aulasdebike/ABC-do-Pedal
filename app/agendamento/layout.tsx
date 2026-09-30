import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agendar Aula Particular de Bicicleta em São Paulo',
  description:
    'Agende sua aula para aprender a andar de bicicleta do zero com segurança no Parque Ibirapuera ou a domicílio na Grande São Paulo com a ABC do Pedal.',
  alternates: {
    canonical: 'https://www.abcdopedal.com.br/agendamento',
  },
  openGraph: {
    title: 'Agendamento de Aulas | ABC do Pedal',
    description:
      'Reserve seu horário para aprender a andar de bicicleta do zero com professor especializado e metodologia estruturada.',
    url: 'https://www.abcdopedal.com.br/agendamento',
  },
};

export default function AgendamentoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
