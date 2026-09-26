import { NextRequest, NextResponse } from 'next/server';
import { checkDirectServiceEligibility } from '@/lib/locations-config';

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

// Coordenadas base do Parque do Ibirapuera (ponto central da escola / CEP 04094-050)
const BASE_LAT = -23.5874;
const BASE_LNG = -46.6576;

/**
 * Cálculo de distância geodésica (Haversine com fator de correção de malha viária urbana)
 * Protegido no backend serverless para não expor a lógica ao cliente.
 */
function calculateEstimatedDistanceKm(lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - BASE_LAT) * Math.PI) / 180;
  const dLon = ((lon2 - BASE_LNG) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((BASE_LAT * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  // Fator de correção viária média de SP (1.32x)
  return Math.max(2, Math.round(straightLine * 1.32));
}

/**
 * GET /api/preco?cep=01310100&number=1000&region=sao_paulo
 * Consulta rápida serverless por CEP
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cep = searchParams.get('cep') || '';
  const number = searchParams.get('number') || '';
  const region = searchParams.get('region') || 'sao_paulo';
  const planId = searchParams.get('planId') || undefined;

  return processPriceCalculation({ cep, number, region, planId });
}

/**
 * POST /api/preco
 * Processamento completo e seguro da calculadora de preços por CEP do Aluno
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return processPriceCalculation(body);
  } catch (error) {
    console.error('Erro ao processar body na rota /api/preco:', error);
    return NextResponse.json(
      { success: false, message: 'Dados inválidos para cálculo de preço.' },
      { status: 400 }
    );
  }
}

/**
 * Lógica central protegida de cálculo de preço e elegibilidade
 */
async function processPriceCalculation(params: {
  cep?: string;
  number?: string;
  region?: string;
  planId?: string;
}) {
  const rawCep = params.cep ? String(params.cep).replace(/\D/g, '') : '';
  const number = params.number ? String(params.number).trim() : '';
  const region = params.region ? String(params.region) : 'sao_paulo';

  if (!rawCep || rawCep.length !== 8) {
    return NextResponse.json(
      { success: false, message: 'Por favor, informe um CEP válido com 8 dígitos numéricos.' },
      { status: 400 }
    );
  }

  // 1. Busca os dados de endereço no ViaCEP (Server-Side)
  let addressData: ViaCepResponse | null = null;
  try {
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (viaCepRes.ok) {
      addressData = await viaCepRes.json();
    }
  } catch (err) {
    console.warn('ViaCEP indisponível ou timeout:', err);
  }

  if (!addressData || addressData.erro === true || addressData.erro === 'true') {
    return NextResponse.json(
      { success: false, message: 'CEP não encontrado. Por favor, verifique os 8 dígitos informados.' },
      { status: 404 }
    );
  }

  const logradouro = (addressData.logradouro || '').trim();
  const bairro = (addressData.bairro || '').trim();
  const cidade = (addressData.localidade || '').trim();
  const uf = (addressData.uf || '').trim();

  // Regra para São Paulo Capital: Aceita somente CEP do município de São Paulo
  if (region === 'sao_paulo') {
    const isSaoPauloCity =
      (cidade.toLowerCase() === 'são paulo' || cidade.toLowerCase() === 'sao paulo') &&
      uf.toUpperCase() === 'SP';

    if (!isSaoPauloCity) {
      return NextResponse.json(
        {
          success: false,
          message: 'Local inválido, esse CEP não pertence à Cidade de São Paulo.',
          city: cidade,
          uf: uf,
        },
        { status: 400 }
      );
    }
  }

  // Montagem do endereço formatado oficial
  const streetPart = logradouro ? `${logradouro}${number ? `, ${number}` : ''}` : `Número ${number || 's/n'}`;
  const neighborhoodPart = bairro ? ` — ${bairro}` : '';
  const fullFormattedAddress = `${streetPart}${neighborhoodPart}, ${cidade} - ${uf}`;

  // 2. Regra de Elegibilidade para Outras Regiões
  if (region === 'outras_localidades') {
    const eligibility = checkDirectServiceEligibility(cidade, bairro, logradouro, rawCep);

    if (!eligibility.eligible) {
      return NextResponse.json({
        success: true,
        eligible: false,
        reason: eligibility.reason,
        identifiedCity: eligibility.identifiedCity,
        identifiedSubRegion: eligibility.identifiedSubRegion,
        city: cidade,
        neighborhood: bairro,
        state: uf,
        address: fullFormattedAddress,
        requiresCustomEvaluation: true,
      });
    }

    // Distância estimada
    let estimatedKm = 15;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey) {
      try {
        const destQuery = encodeURIComponent(`${logradouro} ${number}, ${bairro}, ${cidade} - ${uf}, Brasil`);
        const mapsUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${BASE_LAT},${BASE_LNG}&destinations=${destQuery}&mode=driving&key=${apiKey}`;
        const mapsRes = await fetch(mapsUrl, { signal: AbortSignal.timeout(5000) });
        if (mapsRes.ok) {
          const mapsJson = await mapsRes.json();
          const element = mapsJson?.rows?.[0]?.elements?.[0];
          if (element && element.status === 'OK' && element.distance?.value) {
            estimatedKm = Math.round(element.distance.value / 1000);
          }
        }
      } catch {
        // Fallback
      }
    }

    const basePrice = eligibility.cityConfig?.basePrice ?? 499.0;
    const pricePerKm = eligibility.cityConfig?.pricePerKm ?? 4.0;
    const finalPrice = Math.round((basePrice + estimatedKm * pricePerKm) * 100) / 100;

    return NextResponse.json({
      success: true,
      eligible: true,
      price: finalPrice,
      formattedPrice: `R$ ${finalPrice.toFixed(2).replace('.', ',')}`,
      address: fullFormattedAddress,
      city: cidade,
      state: uf,
      neighborhood: bairro,
      street: logradouro,
      number: number,
      estimatedDistanceKm: estimatedKm,
    });
  }

  // 3. Regra de Preços para São Paulo e ABC Paulista
  let estimatedKm = 10;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const destQuery = encodeURIComponent(`${logradouro} ${number}, ${bairro}, ${cidade} - ${uf}, Brasil`);
      const mapsUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${BASE_LAT},${BASE_LNG}&destinations=${destQuery}&mode=driving&key=${apiKey}`;
      const mapsRes = await fetch(mapsUrl, { signal: AbortSignal.timeout(5000) });
      if (mapsRes.ok) {
        const mapsJson = await mapsRes.json();
        const element = mapsJson?.rows?.[0]?.elements?.[0];
        if (element && element.status === 'OK' && element.distance?.value) {
          estimatedKm = Math.round(element.distance.value / 1000);
        }
      }
    } catch {
      // Fallback
    }
  }

  let finalPrice = 499.0;
  const lowerCity = cidade.toLowerCase();

  if (lowerCity.includes('santo andr') || lowerCity.includes('são bernardo') || lowerCity.includes('sao bernardo')) {
    finalPrice = 399.0;
  } else if (lowerCity.includes('são caetano') || lowerCity.includes('sao caetano') || lowerCity.includes('diadema')) {
    finalPrice = 449.0;
  } else if (estimatedKm <= 15) {
    finalPrice = 499.0;
  } else if (estimatedKm <= 25) {
    finalPrice = 549.0;
  } else if (estimatedKm <= 40) {
    finalPrice = 599.0;
  } else if (estimatedKm <= 55) {
    finalPrice = 649.0;
  } else {
    finalPrice = 699.0;
  }

  return NextResponse.json({
    success: true,
    eligible: true,
    price: finalPrice,
    formattedPrice: `R$ ${finalPrice.toFixed(2).replace('.', ',')}`,
    address: fullFormattedAddress,
    city: cidade,
    state: uf,
    neighborhood: bairro,
    street: logradouro,
    number: number,
    estimatedDistanceKm: estimatedKm,
  });
}
