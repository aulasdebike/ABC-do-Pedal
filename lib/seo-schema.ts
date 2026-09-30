/**
 * Dados estruturados Schema.org (JSON-LD) para ABC do Pedal
 * Estritamente baseados em informações reais e confirmadas da escola:
 * - Localização e atendimento real: São Paulo - SP (Parque Ibirapuera e Grande SP)
 * - Telefone oficial de contato/WhatsApp: +55 (11) 95043-8948
 * - Serviços reais: Aulas particulares para aprender a andar de bicicleta do zero
 * - FAQ real: Perguntas e respostas exatamente como exibidas na página
 */

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'SportsClub'],
  '@id': 'https://www.abcdopedal.com.br/#organization',
  name: 'ABC do Pedal',
  legalName: 'ABC do Pedal - Escola de Bicicleta do Zero',
  alternateName: [
    'Escola de Bicicleta ABC do Pedal',
    'ABC do Pedal São Paulo',
    'Aulas de Bicicleta ABC do Pedal'
  ],
  url: 'https://www.abcdopedal.com.br',
  logo: 'https://www.abcdopedal.com.br/logo.png',
  image: 'https://www.abcdopedal.com.br/og-image.jpg',
  description:
    'Escola profissional de bicicleta especializada em ensinar adultos, idosos, jovens e crianças a andar de bicicleta do zero com segurança, paciência e metodologia estruturada em São Paulo.',
  telephone: '+5511950438948',
  email: 'aulasdebike@gmail.com',
  priceRange: '$$',
  currenciesAccepted: 'BRL',
  paymentAccepted: 'Pix, Cartão de Crédito',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Parque Ibirapuera - Av. Pedro Álvares Cabral, s/n',
    addressLocality: 'São Paulo',
    addressRegion: 'SP',
    postalCode: '04094-050',
    addressCountry: 'BR'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -23.5874,
    longitude: -46.6576
  },
  areaServed: [
    { '@type': 'City', name: 'São Paulo' },
    { '@type': 'City', name: 'Santo André' },
    { '@type': 'City', name: 'São Bernardo do Campo' },
    { '@type': 'City', name: 'São Caetano do Sul' },
    { '@type': 'City', name: 'Diadema' }
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Aulas de Bicicleta',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Aulas de Bicicleta para Adultos',
          description: 'Aulas individuais e acolhedoras para adultos aprenderem a pedalar do zero sem vergonha e com segurança.'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Aulas de Bicicleta para Idosos',
          description: 'Metodologia com foco em equilíbrio, respeito ao limite corporal, paciência e segurança para a melhor idade.'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Aulas de Bicicleta para Crianças e Jovens',
          description: 'Desenvolvimento de equilíbrio, coordenação motora e autonomia em duas rodas de forma lúdica.'
        }
      }
    ]
  },
  sameAs: [
    'https://wa.me/5511950438948'
  ]
};

export const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.abcdopedal.com.br/#service',
  name: 'Aulas para Aprender a Andar de Bicicleta em São Paulo',
  serviceType: 'Aulas Particulares de Bicicleta do Zero',
  provider: {
    '@id': 'https://www.abcdopedal.com.br/#organization'
  },
  areaServed: {
    '@type': 'City',
    name: 'São Paulo'
  },
  description:
    'Metodologia de 5 passos para aprender a andar de bicicleta do zero com acompanhamento individual de instrutor especializado, bicicleta de treino e equipamentos fornecidos.',
  termsOfService: 'https://www.abcdopedal.com.br/nossos-planos'
};

export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'A escola fornece a bicicleta e os materiais de proteção?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sim, absolutamente! Fornecemos todas as bicicletas de treino, adaptadas para adolescentes, adultos e idosos de qualquer altura, bem como capacetes higienizados e os equipamentos indispensáveis de segurança.'
      }
    },
    {
      '@type': 'Question',
      name: 'Tenho mais de 60 anos ou sofro com bloqueio corporal. Eu consigo aprender?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Claro que sim. O Método ABC-DE é focado exatamente em idades e bloqueios variados. Nossos alunos são, em sua enorme maioria, adultos e idosos. Não realizamos qualquer movimento brusco ou forçado, respeitando seu limite motriz.'
      }
    },
    {
      '@type': 'Question',
      name: 'Como agendo meu horário e escolho o local da aula?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Todo o processo é ajustado com simplicidade pelo WhatsApp ou pelo sistema de agendamento online. Você pode escolher treinar em áreas privadas do seu condomínio, praças tranquilas ou diretamente no Parque Ibirapuera em horários planos e pacíficos.'
      }
    }
  ]
};
