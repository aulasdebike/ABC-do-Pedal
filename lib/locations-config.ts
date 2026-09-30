export type RegionId = 'sao_paulo' | 'abc_paulista' | 'outras_localidades';

export type MunicipalLocationStatus = 'disponivel' | 'indisponivel';

export interface RegionCardConfig {
  id: RegionId;
  title: string;
  text: string;
  image: string;
}

/**
 * Cadastro Oficial Único de Locais (Fonte Única da Verdade)
 * Cada local possui obrigatoriamente:
 * - locationId: identificador único e estável
 * - name: nome de exibição
 * - region: 'sao_paulo' | 'abc_paulista' | 'outras_localidades'
 * - city: município
 * - subRegion: sub-região ou bairro de atendimento
 * - status: 'disponivel' | 'indisponivel'
 * - address: endereço ou ponto de encontro oficial
 */
export interface OfficialLocation {
  locationId: string;
  name: string;
  region: RegionId;
  city: string;
  subRegion: string;
  status: MunicipalLocationStatus;
  address: string;
  // Propriedades complementares / compatibilidade
  id: string; // Alias direto de locationId
  price: number;
  isFixed: boolean;
  fixedNote?: string;
  restrictionNote?: string;
  isKidsOnly?: boolean;
  notes?: string;
  description?: string;
  image?: string;
  requiresCustomAddress?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Aliases de tipos para retrocompatibilidade total com módulos existentes
export type LocationConfigItem = OfficialLocation;
export type MunicipalClassLocation = OfficialLocation;

export interface BookingSelectedLocation {
  region: RegionId;
  regionTitle: string;
  locationId: string;
  locationName: string;
  city: string;
  subRegion?: string;
  state?: string;
  address?: string;
  cep?: string;
  number?: string;
  price: number;
  isFixed: boolean;
  fixedNote?: string;
  priceNote?: string;
  mapsUrl?: string;
  requiresCustomAddress?: boolean;
}

export const INITIAL_REGIONS: RegionCardConfig[] = [
  {
    id: 'sao_paulo',
    title: 'São Paulo',
    text: 'Polo Ibirapuera (Desafio do Pedal) ou atendimento sob demanda em outras localidades (Aprenda a Pedalar).',
    image: '/locations/sao_paulo.jpg'
  },
  {
    id: 'abc_paulista',
    title: 'ABC Paulista',
    text: 'Santo André e São Bernardo do Campo (Desafio do Pedal) ou outros municípios do ABC (Aprenda a Pedalar).',
    image: '/locations/abc_paulista.jpg'
  },
  {
    id: 'outras_localidades',
    title: 'Outras Regiões',
    text: 'Cidades fora de São Paulo e ABC com atendimento exclusivo (Imersão do Pedal).',
    image: '/locations/outras_localidades.jpg'
  }
];

/**
 * Cadastro inicial oficial e padronizado de todas as localidades da ABC do Pedal
 */
export const INITIAL_OFFICIAL_LOCATIONS: OfficialLocation[] = [
  // 1. SÃO PAULO - POLO OFICIAL IBIRAPUERA
  {
    locationId: 'ibirapuera',
    id: 'ibirapuera',
    name: 'Parque do Ibirapuera',
    region: 'sao_paulo',
    city: 'São Paulo',
    subRegion: 'Ibirapuera',
    status: 'disponivel',
    address: 'Avenida Pedro Álvares Cabral, s/n — Vila Mariana, São Paulo/SP (Portão 10)',
    price: 499.00,
    isFixed: true,
    fixedNote: 'Local fixo de atendimento da ABC do Pedal.',
    description: 'Pista plana, asfaltada e 100% isolada do trânsito de automóveis. Ambiente ideal e seguro para as primeiras pedaladas.',
    image: '/locations/ibirapuera.jpg',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  // 2. SANTO ANDRÉ - PAÇO MUNICIPAL
  {
    locationId: 'sa_paco_municipal',
    id: 'sa_paco_municipal',
    name: 'Paço Municipal de Santo André',
    region: 'abc_paulista',
    city: 'Santo André',
    subRegion: 'Santo André',
    status: 'disponivel',
    address: 'Praça IV Centenário, s/n - Centro, Santo André - SP',
    price: 399.00,
    isFixed: true,
    fixedNote: 'Local fixo cadastrado no ABC Paulista.',
    description: 'Piso regular, amplo e excelente para desenvolvimento gradual com total segurança.',
    image: '/locations/santo_andre.jpg',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  // 3. SANTO ANDRÉ - PARQUE CELSO DANIEL (EXCLUSIVO CRIANÇAS)
  {
    locationId: 'sa_parque_celso_daniel',
    id: 'sa_parque_celso_daniel',
    name: 'Parque Celso Daniel',
    region: 'abc_paulista',
    city: 'Santo André',
    subRegion: 'Santo André',
    status: 'disponivel',
    restrictionNote: 'Exclusivo para crianças',
    isKidsOnly: true,
    address: 'Av. Dom Pedro II, 940 - Bairro Jardim, Santo André - SP',
    price: 399.00,
    isFixed: true,
    fixedNote: 'Ambiente seguro com restrição de uso exclusivo para crianças e adolescentes.',
    description: 'Ambiente acolhedor e protegido, com restrição de uso exclusivo para crianças.',
    image: '/locations/santo_andre.jpg',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  // 4. SANTO ANDRÉ - PARQUE CENTRAL (INATIVO INICIALMENTE)
  {
    locationId: 'sa_parque_central',
    id: 'sa_parque_central',
    name: 'Parque Central',
    region: 'abc_paulista',
    city: 'Santo André',
    subRegion: 'Santo André',
    status: 'indisponivel',
    restrictionNote: 'Inativo inicialmente',
    address: 'Rua José Bonifácio, s/n - Vila Assunção, Santo André - SP',
    price: 399.00,
    isFixed: true,
    notes: 'Inativo inicialmente — podendo ser ativado pelo instrutor no painel quando liberado para utilização.',
    description: 'Parque amplo com pistas de asfalto e áreas abertas.',
    image: '/locations/santo_andre.jpg',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  // 5. SÃO BERNARDO DO CAMPO - POLIESPORTIVO DA KENNEDY
  {
    locationId: 'sbc_poliesportivo_kennedy',
    id: 'sbc_poliesportivo_kennedy',
    name: 'Poliesportivo da Kennedy',
    region: 'abc_paulista',
    city: 'São Bernardo do Campo',
    subRegion: 'São Bernardo do Campo',
    status: 'disponivel',
    address: 'Av. Kennedy, 1155 - Parque São Diogo, São Bernardo do Campo - SP',
    price: 399.00,
    isFixed: true,
    fixedNote: 'Local fixo cadastrado no ABC Paulista.',
    description: 'Espaço amplo, plano e seguro, ideal para treino de equilíbrio e autonomia.',
    image: '/locations/sao_bernardo.jpg',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  // 6. SÃO BERNARDO DO CAMPO - PAÇO MUNICIPAL
  {
    locationId: 'sbc_paco_municipal',
    id: 'sbc_paco_municipal',
    name: 'Paço Municipal de São Bernardo do Campo',
    region: 'abc_paulista',
    city: 'São Bernardo do Campo',
    subRegion: 'São Bernardo do Campo',
    status: 'disponivel',
    address: 'Praça Samuel Sabatini, 50 - Centro, São Bernardo do Campo - SP',
    price: 399.00,
    isFixed: true,
    fixedNote: 'Local fixo cadastrado no ABC Paulista.',
    description: 'Esplanada asfaltada, plana e protegida para as primeiras manobras.',
    image: '/locations/sao_bernardo.jpg',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  // 7. SÃO PAULO - OUTRAS LOCALIDADES (SOB CONSULTA DE ENDEREÇO)
  {
    locationId: 'sp_outras_localidades',
    id: 'sp_outras_localidades',
    name: 'Outras localidades (São Paulo)',
    region: 'sao_paulo',
    city: 'São Paulo',
    subRegion: 'Outras localidades',
    status: 'disponivel',
    address: 'A definir pelo aluno / Sob consulta de endereço',
    price: 499.00,
    isFixed: false,
    requiresCustomAddress: true,
    description: 'Parques, praças, condomínios e outros espaços adequados podem receber a aula em São Paulo.',
    image: '/locations/outras_localidades.jpg',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  // 8. ABC PAULISTA - OUTROS MUNICÍPIOS / SOB DEMANDA
  {
    locationId: 'abc_outras_localidades',
    id: 'abc_outras_localidades',
    name: 'Outras localidades (ABC Paulista)',
    region: 'abc_paulista',
    city: 'ABC Paulista',
    subRegion: 'Outros municípios',
    status: 'disponivel',
    address: 'A definir pelo aluno / Sob consulta de endereço',
    price: 399.00,
    isFixed: false,
    requiresCustomAddress: true,
    description: 'Atendimento sob demanda no ABC Paulista (condomínios ou outros municípios do ABC).',
    image: '/locations/abc_paulista.jpg',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  // 9. OUTRAS REGIÕES - SOB DEMANDA / IMERSÃO DO PEDAL
  {
    locationId: 'outras_localidades',
    id: 'outras_localidades',
    name: 'Outras Regiões (sob demanda)',
    region: 'outras_localidades',
    city: 'Outras localidades',
    subRegion: 'Outras localidades',
    status: 'disponivel',
    address: 'A definir pelo CEP',
    price: 499.00,
    isFixed: false,
    requiresCustomAddress: true,
    description: 'Atendimento exclusivo fora de São Paulo e ABC, realizado em um encontro de 2 horas (Imersão do Pedal).',
    image: '/locations/outras_localidades.jpg',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

// Aliases retrocompatíveis
export const INITIAL_LOCATIONS: LocationConfigItem[] = INITIAL_OFFICIAL_LOCATIONS;
export const INITIAL_MUNICIPAL_CLASS_LOCATIONS: MunicipalClassLocation[] = INITIAL_OFFICIAL_LOCATIONS;

const OFFICIAL_LOCATIONS_STORAGE_KEY = 'abc_do_pedal_official_locations_v3';
const LEGACY_MUNICIPAL_KEY = 'abc_do_pedal_municipal_class_locations_v2';
const LEGACY_CONFIGURABLE_KEY = 'abc_do_pedal_configurable_locations_v1';

/**
 * Normaliza qualquer ID bruto para seu locationId canônico estável
 */
export function normalizeLocationId(rawId?: string | null): string {
  if (!rawId) return '';
  const clean = rawId.toLowerCase().trim();
  if (clean === 'sp_parque_ibirapuera' || clean === 'sp_ibira' || clean === 'ibirapuera') return 'ibirapuera';
  if (clean === 'sa_paco' || clean === 'sa_paco_municipal') return 'sa_paco_municipal';
  if (clean === 'sa_celso' || clean === 'sa_parque_celso_daniel') return 'sa_parque_celso_daniel';
  if (clean === 'sa_central' || clean === 'sa_parque_central') return 'sa_parque_central';
  if (clean === 'sbc_kennedy' || clean === 'sbc_poliesportivo_kennedy') return 'sbc_poliesportivo_kennedy';
  if (clean === 'sbc_paco' || clean === 'sbc_paco_municipal') return 'sbc_paco_municipal';
  if (clean === 'sp_outras' || clean === 'sp_outras_localidades') return 'sp_outras_localidades';
  if (clean === 'abc_outros' || clean === 'abc_outras_localidades') return 'abc_outras_localidades';
  if (clean === 'outras_localidades_direto' || clean === 'outras_direto' || clean === 'outras_localidades') return 'outras_localidades';
  return clean;
}

/**
 * Normaliza o nome do município para comparações seguras sem acentos
 */
export function normalizeCityName(city?: string): string {
  if (!city) return '';
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Gera um locationId estável e padronizado a partir do nome e cidade
 */
export function generateLocationId(name: string, city: string): string {
  const normName = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const normCity = city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  let prefix = 'loc';
  if (normCity.includes('santo andre')) prefix = 'sa';
  else if (normCity.includes('sao bernardo')) prefix = 'sbc';
  else if (normCity.includes('sao paulo')) prefix = 'sp';

  return `${prefix}_${normName}`;
}

/**
 * Carrega a lista oficial de locais (única fonte da verdade)
 */
export function getStoredOfficialLocations(): OfficialLocation[] {
  if (typeof window === 'undefined') return INITIAL_OFFICIAL_LOCATIONS;
  try {
    const raw = localStorage.getItem(OFFICIAL_LOCATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          ...item,
          locationId: normalizeLocationId(item.locationId || item.id),
          id: normalizeLocationId(item.locationId || item.id)
        }));
      }
    }

    // Se ainda não existir no key v3, migra dados de versões anteriores
    const legacyRaw = localStorage.getItem(LEGACY_MUNICIPAL_KEY) || localStorage.getItem(LEGACY_CONFIGURABLE_KEY);
    if (legacyRaw) {
      try {
        const legacyParsed = JSON.parse(legacyRaw);
        if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
          // Mescla garantindo que os oficiais base existam com IDs estáveis
          const merged = [...INITIAL_OFFICIAL_LOCATIONS];
          legacyParsed.forEach((oldItem: any) => {
            const normId = normalizeLocationId(oldItem.id || oldItem.locationId);
            const exists = merged.some((m) => m.locationId === normId);
            if (!exists && oldItem.name) {
              const newId = generateLocationId(oldItem.name, oldItem.city || '');
              merged.push({
                locationId: newId,
                id: newId,
                name: oldItem.name,
                region: oldItem.region || (oldItem.city?.toLowerCase().includes('são paulo') ? 'sao_paulo' : 'abc_paulista'),
                city: oldItem.city || 'Santo André',
                subRegion: oldItem.subRegion || oldItem.city || 'Santo André',
                status: oldItem.status === 'indisponivel' ? 'indisponivel' : 'disponivel',
                address: oldItem.address || 'Endereço cadastrado',
                price: oldItem.price || 399.00,
                isFixed: oldItem.isFixed ?? true,
                restrictionNote: oldItem.restrictionNote,
                isKidsOnly: oldItem.isKidsOnly,
                notes: oldItem.notes
              });
            }
          });
          saveStoredOfficialLocations(merged);
          return merged;
        }
      } catch {}
    }

    saveStoredOfficialLocations(INITIAL_OFFICIAL_LOCATIONS);
    return INITIAL_OFFICIAL_LOCATIONS;
  } catch (err) {
    console.error('Erro ao ler locais oficiais:', err);
    return INITIAL_OFFICIAL_LOCATIONS;
  }
}

/**
 * Salva a lista de locais e dispara eventos de sincronização em tempo real
 */
export function saveStoredOfficialLocations(locations: OfficialLocation[]): void {
  if (typeof window === 'undefined') return;
  try {
    const normalized = locations.map((loc) => ({
      ...loc,
      locationId: normalizeLocationId(loc.locationId || loc.id),
      id: normalizeLocationId(loc.locationId || loc.id)
    }));

    localStorage.setItem(OFFICIAL_LOCATIONS_STORAGE_KEY, JSON.stringify(normalized));
    // Sincroniza retrocompatibilidade
    localStorage.setItem(LEGACY_MUNICIPAL_KEY, JSON.stringify(normalized));
    localStorage.setItem(LEGACY_CONFIGURABLE_KEY, JSON.stringify(normalized));

    window.dispatchEvent(new CustomEvent('abc_official_locations_updated', { detail: normalized }));
    window.dispatchEvent(new CustomEvent('abc_municipal_locations_updated', { detail: normalized }));
  } catch (err) {
    console.error('Erro ao salvar locais oficiais:', err);
  }
}

// Funções de leitura retrocompatíveis
export function getStoredLocations(): OfficialLocation[] {
  return getStoredOfficialLocations();
}

export function saveStoredLocations(locations: OfficialLocation[]): void {
  saveStoredOfficialLocations(locations);
}

export function getStoredMunicipalClassLocations(): OfficialLocation[] {
  return getStoredOfficialLocations();
}

export function saveStoredMunicipalClassLocations(locations: OfficialLocation[]): void {
  saveStoredOfficialLocations(locations);
}

export type NewOfficialLocationInput = {
  name: string;
  city: string;
  locationId?: string;
  id?: string;
  region?: RegionId;
  subRegion?: string;
  status?: MunicipalLocationStatus;
  address?: string;
  price?: number;
  isFixed?: boolean;
  restrictionNote?: string;
  isKidsOnly?: boolean;
  notes?: string;
  description?: string;
  image?: string;
  requiresCustomAddress?: boolean;
  fixedNote?: string;
};

export type NewMunicipalLocationInput = NewOfficialLocationInput;

/**
 * Adiciona um novo local ao cadastro único
 */
export function addOfficialLocation(
  item: NewOfficialLocationInput
): OfficialLocation[] {
  const current = getStoredOfficialLocations();
  const stableId = item.locationId ? normalizeLocationId(item.locationId) : generateLocationId(item.name, item.city);
  const normCity = item.city || 'Santo André';
  let inferredRegion: RegionId = item.region || 'abc_paulista';
  if (normCity.toLowerCase().includes('são paulo') || normCity.toLowerCase().includes('sao paulo')) {
    inferredRegion = 'sao_paulo';
  }

  const newLocation: OfficialLocation = {
    ...item,
    name: item.name,
    city: normCity,
    region: inferredRegion,
    subRegion: item.subRegion || normCity,
    status: item.status || 'disponivel',
    address: item.address || 'Endereço a definir',
    price: item.price !== undefined ? item.price : (inferredRegion === 'sao_paulo' ? 499 : 399),
    isFixed: item.isFixed ?? true,
    locationId: stableId,
    id: stableId,
    createdAt: new Date().toISOString()
  };

  const updated = current.some((l) => l.locationId === stableId)
    ? current.map((l) => (l.locationId === stableId ? { ...l, ...newLocation } : l))
    : [...current, newLocation];

  saveStoredOfficialLocations(updated);
  return updated;
}

export function addMunicipalClassLocation(
  item: NewMunicipalLocationInput
): OfficialLocation[] {
  return addOfficialLocation(item);
}

export function addConfigurableLocation(newLoc: OfficialLocation): OfficialLocation[] {
  return addOfficialLocation(newLoc);
}

/**
 * Atualiza um local existente
 */
export function updateOfficialLocation(
  locationId: string,
  updates: Partial<OfficialLocation>
): OfficialLocation[] {
  const current = getStoredOfficialLocations();
  const targetId = normalizeLocationId(locationId);

  const updated = current.map((loc) => {
    if (loc.locationId === targetId || loc.id === targetId) {
      return {
        ...loc,
        ...updates,
        locationId: loc.locationId,
        id: loc.locationId,
        updatedAt: new Date().toISOString()
      };
    }
    return loc;
  });

  saveStoredOfficialLocations(updated);
  return updated;
}

export function updateMunicipalClassLocation(
  id: string,
  updates: Partial<MunicipalClassLocation>
): OfficialLocation[] {
  return updateOfficialLocation(id, updates);
}

/**
 * Alterna status entre 'disponivel' e 'indisponivel'
 */
export function toggleOfficialLocationStatus(locationId: string): OfficialLocation[] {
  const current = getStoredOfficialLocations();
  const targetId = normalizeLocationId(locationId);
  const target = current.find((l) => l.locationId === targetId || l.id === targetId);
  if (!target) return current;

  const newStatus: MunicipalLocationStatus = target.status === 'disponivel' ? 'indisponivel' : 'disponivel';
  return updateOfficialLocation(target.locationId, { status: newStatus });
}

export function toggleMunicipalLocationStatus(id: string): OfficialLocation[] {
  return toggleOfficialLocationStatus(id);
}

/**
 * Remove local do cadastro
 */
export function deleteOfficialLocation(locationId: string): OfficialLocation[] {
  const current = getStoredOfficialLocations();
  const targetId = normalizeLocationId(locationId);
  const updated = current.filter((l) => l.locationId !== targetId && l.id !== targetId);
  saveStoredOfficialLocations(updated);
  return updated;
}

export function deleteMunicipalClassLocation(id: string): OfficialLocation[] {
  return deleteOfficialLocation(id);
}

/**
 * Restaura cadastro aos locais iniciais oficiais
 */
export function resetOfficialLocationsToDefault(): OfficialLocation[] {
  saveStoredOfficialLocations(INITIAL_OFFICIAL_LOCATIONS);
  return INITIAL_OFFICIAL_LOCATIONS;
}

export function resetMunicipalClassLocationsToDefault(): OfficialLocation[] {
  return resetOfficialLocationsToDefault();
}

/**
 * Busca local oficial por locationId (ou alias)
 */
export function findOfficialLocationById(locationId?: string | null): OfficialLocation | undefined {
  if (!locationId) return undefined;
  const normId = normalizeLocationId(locationId);
  const all = getStoredOfficialLocations();
  return all.find((l) => l.locationId === normId || l.id === normId);
}

/**
 * Busca local oficial por nome e contexto (cidade/sub-região)
 */
export function findOfficialLocationByNameOrContext(
  name?: string | null,
  city?: string | null,
  subRegion?: string | null
): OfficialLocation | undefined {
  const all = getStoredOfficialLocations();
  if (!name && !city && !subRegion) return undefined;

  const normalize = (s?: string | null) =>
    (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const normName = normalize(name);
  const normCity = normalize(city);
  const normSub = normalize(subRegion);

  if (normName.includes('ibirapuera')) {
    return all.find((l) => l.locationId === 'ibirapuera');
  }
  if (normName.includes('celso daniel')) {
    return all.find((l) => l.locationId === 'sa_parque_celso_daniel');
  }
  if (normName.includes('kennedy')) {
    return all.find((l) => l.locationId === 'sbc_poliesportivo_kennedy');
  }
  if (normName.includes('central') && (normName.includes('parque') || normCity.includes('andre'))) {
    return all.find((l) => l.locationId === 'sa_parque_central');
  }
  if (normName.includes('paco') || normName.includes('paço')) {
    if (normCity.includes('andre') || normSub.includes('andre')) {
      return all.find((l) => l.locationId === 'sa_paco_municipal');
    }
    if (normCity.includes('bernardo') || normSub.includes('bernardo')) {
      return all.find((l) => l.locationId === 'sbc_paco_municipal');
    }
  }

  // Tenta match exato por nome
  const exactMatch = all.find((l) => normalize(l.name) === normName);
  if (exactMatch) return exactMatch;

  // Tenta match parcial
  const partialMatch = all.find((l) => {
    const lNorm = normalize(l.name);
    return lNorm.includes(normName) || normName.includes(lNorm);
  });
  if (partialMatch) return partialMatch;

  return undefined;
}

/**
 * Resolve o locationId correto de um slot, curando registros históricos ou com IDs arbitrários
 */
export function resolveLocationIdFromSlot(slot?: {
  locationId?: string;
  locationName?: string;
  subRegion?: string;
  city?: string;
  region?: string;
} | null): string {
  if (!slot) return '';
  const normId = normalizeLocationId(slot.locationId);
  const all = getStoredOfficialLocations();

  // 1. Se já possui um locationId canônico válido
  if (normId) {
    const found = all.find((l) => l.locationId === normId || l.id === normId);
    if (found) return found.locationId;
  }

  // 2. Resolve pelo nome do local ou contexto
  const byName = findOfficialLocationByNameOrContext(slot.locationName, slot.city, slot.subRegion);
  if (byName) return byName.locationId;

  return normId || '';
}

/**
 * Normaliza e enriquece os dados de um slot com os valores padronizados do cadastro oficial
 */
export function normalizeSlotLocation<T extends {
  locationId?: string;
  locationName?: string;
  region?: string;
  regionName?: string;
  city?: string;
  subRegion?: string;
  isKidsOnly?: boolean;
}>(slot: T): T {
  const resolvedId = resolveLocationIdFromSlot(slot);
  const official = findOfficialLocationById(resolvedId) || findOfficialLocationByNameOrContext(slot.locationName, slot.city, slot.subRegion);

  if (official) {
    const regionTitles: Record<string, string> = {
      sao_paulo: 'São Paulo',
      abc_paulista: 'ABC Paulista',
      outras_localidades: 'Outras Regiões'
    };
    return {
      ...slot,
      locationId: official.locationId,
      locationName: official.name,
      region: official.region,
      regionName: regionTitles[official.region] || slot.regionName || 'ABC do Pedal',
      city: official.city,
      subRegion: official.subRegion,
      isKidsOnly: official.isKidsOnly ?? slot.isKidsOnly
    };
  }

  const normId = normalizeLocationId(slot.locationId);
  return {
    ...slot,
    locationId: normId || slot.locationId
  };
}

/**
 * Retorna locais oficiais por região
 */
export function getOfficialLocationsByRegion(
  region: RegionId,
  onlyAvailable = true
): OfficialLocation[] {
  const all = getStoredOfficialLocations();
  return all.filter((l) => {
    if (l.region !== region) return false;
    if (onlyAvailable && l.status !== 'disponivel') return false;
    return true;
  });
}

/**
 * Retorna locais oficiais disponíveis para uma cidade
 */
export function getAvailableClassLocationsForCity(city?: string): OfficialLocation[] {
  const all = getStoredOfficialLocations();
  const availableOnly = all.filter((l) => l.status === 'disponivel');
  if (!city) return availableOnly;

  const normCity = normalizeCityName(city);
  return availableOnly.filter((l) => {
    const normLocCity = normalizeCityName(l.city);
    return normLocCity.includes(normCity) || normCity.includes(normLocCity);
  });
}

/**
 * Retorna todos os locais oficiais (disponíveis e indisponíveis) para uma cidade
 */
export function getAllClassLocationsForCity(city?: string): OfficialLocation[] {
  const all = getStoredOfficialLocations();
  if (!city) return all;

  const normCity = normalizeCityName(city);
  return all.filter((l) => {
    const normLocCity = normalizeCityName(l.city);
    return normLocCity.includes(normCity) || normCity.includes(normLocCity);
  });
}

export interface DirectServiceCityConfig {
  id: string;
  cityName: string;
  normalizedName: string;
  state: string;
  active: boolean;
  pricingType: 'distance_formula' | 'fixed';
  basePrice: number;
  pricePerKm?: number;
  fixedPrice?: number;
  allowedSubRegions?: string[];
  onlyAllowedSubRegions?: boolean;
  subRegionNotes?: string;
  notes?: string;
}

export const INITIAL_DIRECT_SERVICE_CITIES: DirectServiceCityConfig[] = [
  {
    id: 'osasco',
    cityName: 'Osasco',
    normalizedName: 'osasco',
    state: 'SP',
    active: true,
    pricingType: 'distance_formula',
    basePrice: 499.00,
    pricePerKm: 4.00,
    notes: 'Atendimento direto - cálculo por distância Google Maps (R$ 499,00 + km × R$ 4,00)'
  },
  {
    id: 'diadema',
    cityName: 'Diadema',
    normalizedName: 'diadema',
    state: 'SP',
    active: true,
    pricingType: 'distance_formula',
    basePrice: 499.00,
    pricePerKm: 4.00,
    notes: 'Atendimento direto - cálculo por distância Google Maps (R$ 499,00 + km × R$ 4,00)'
  },
  {
    id: 'maua',
    cityName: 'Mauá',
    normalizedName: 'maua',
    state: 'SP',
    active: true,
    pricingType: 'distance_formula',
    basePrice: 499.00,
    pricePerKm: 4.00,
    notes: 'Atendimento direto - cálculo por distância Google Maps (R$ 499,00 + km × R$ 4,00)'
  },
  {
    id: 'ribeirao_pires',
    cityName: 'Ribeirão Pires',
    normalizedName: 'ribeirao pires',
    state: 'SP',
    active: true,
    pricingType: 'distance_formula',
    basePrice: 499.00,
    pricePerKm: 4.00,
    notes: 'Atendimento direto - cálculo por distância Google Maps (R$ 499,00 + km × R$ 4,00)'
  },
  {
    id: 'taboao_da_serra',
    cityName: 'Taboão da Serra',
    normalizedName: 'taboao da serra',
    state: 'SP',
    active: true,
    pricingType: 'distance_formula',
    basePrice: 499.00,
    pricePerKm: 4.00,
    notes: 'Atendimento direto - cálculo por distância Google Maps (R$ 499,00 + km × R$ 4,00)'
  },
  {
    id: 'embu_das_artes',
    cityName: 'Embu das Artes',
    normalizedName: 'embu das artes',
    state: 'SP',
    active: true,
    pricingType: 'distance_formula',
    basePrice: 499.00,
    pricePerKm: 4.00,
    notes: 'Atendimento direto - cálculo por distância Google Maps (R$ 499,00 + km × R$ 4,00)'
  },
  {
    id: 'barueri_alphaville',
    cityName: 'Barueri',
    normalizedName: 'barueri',
    state: 'SP',
    active: true,
    pricingType: 'distance_formula',
    basePrice: 499.00,
    pricePerKm: 4.00,
    allowedSubRegions: ['alphaville', 'alpha'],
    onlyAllowedSubRegions: true,
    subRegionNotes: 'Somente Alphaville',
    notes: 'Atendimento direto restrito à região de Alphaville'
  }
];

const DIRECT_CITIES_STORAGE_KEY = 'abc_do_pedal_direct_service_cities_v1';

export function normalizeCityString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getStoredDirectServiceCities(): DirectServiceCityConfig[] {
  if (typeof window === 'undefined') return INITIAL_DIRECT_SERVICE_CITIES;
  try {
    const raw = localStorage.getItem(DIRECT_CITIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DIRECT_CITIES_STORAGE_KEY, JSON.stringify(INITIAL_DIRECT_SERVICE_CITIES));
      return INITIAL_DIRECT_SERVICE_CITIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_DIRECT_SERVICE_CITIES;
  } catch (err) {
    console.error('Erro ao ler cidades de atendimento direto:', err);
    return INITIAL_DIRECT_SERVICE_CITIES;
  }
}

export function saveStoredDirectServiceCities(cities: DirectServiceCityConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DIRECT_CITIES_STORAGE_KEY, JSON.stringify(cities));
  } catch (err) {
    console.error('Erro ao salvar cidades de atendimento direto:', err);
  }
}

export function checkDirectServiceEligibility(
  city: string,
  neighborhood?: string,
  street?: string,
  cep?: string
): {
  eligible: boolean;
  cityConfig?: DirectServiceCityConfig;
  reason?: 'outside_service_area' | 'barueri_non_alphaville' | 'inactive';
  identifiedCity: string;
  identifiedSubRegion?: string;
} {
  const normCity = normalizeCityString(city);
  const cities = getStoredDirectServiceCities();

  const match = cities.find((c) => {
    const cNorm = normalizeCityString(c.cityName);
    const keyNorm = normalizeCityString(c.normalizedName);
    return normCity === cNorm || normCity === keyNorm || (normCity === 'embu' && cNorm.includes('embu'));
  });

  if (!match || !match.active) {
    return {
      eligible: false,
      reason: match && !match.active ? 'inactive' : 'outside_service_area',
      identifiedCity: city
    };
  }

  // Regra especial para Barueri (somente Alphaville)
  if (match.onlyAllowedSubRegions && match.allowedSubRegions && match.allowedSubRegions.length > 0) {
    const normBairro = normalizeCityString(neighborhood || '');
    const normStreet = normalizeCityString(street || '');
    const cleanCep = (cep || '').replace(/\D/g, '');

    const isAlphavilleBairro = match.allowedSubRegions.some((sub) =>
      normBairro.includes(normalizeCityString(sub))
    );
    const isAlphavilleStreet = match.allowedSubRegions.some((sub) =>
      normStreet.includes(normalizeCityString(sub))
    );
    // Faixas CEP comuns de Alphaville Barueri: 06453xxx a 06455xxx, 06472xxx a 06474xxx, 06485xxx
    const isAlphavilleCep =
      cleanCep.startsWith('06453') ||
      cleanCep.startsWith('06454') ||
      cleanCep.startsWith('06455') ||
      cleanCep.startsWith('06472') ||
      cleanCep.startsWith('06473') ||
      cleanCep.startsWith('06474') ||
      cleanCep.startsWith('06485');

    const isAllowed = isAlphavilleBairro || isAlphavilleStreet || isAlphavilleCep;

    if (!isAllowed) {
      return {
        eligible: false,
        cityConfig: match,
        reason: 'barueri_non_alphaville',
        identifiedCity: match.cityName,
        identifiedSubRegion: neighborhood || 'Fora de Alphaville'
      };
    }

    return {
      eligible: true,
      cityConfig: match,
      identifiedCity: match.cityName,
      identifiedSubRegion: 'Alphaville'
    };
  }

  return {
    eligible: true,
    cityConfig: match,
    identifiedCity: match.cityName
  };
}

/**
 * Cidades específicas do ABC Paulista com regra especial de transição para o WhatsApp oficial
 */
export const SPECIAL_ABC_PAYMENT_CITIES = [
  'Diadema',
  'Mauá',
  'São Caetano do Sul',
  'Ribeirão Pires'
] as const;

/**
 * Verifica se a localidade selecionada corresponde exclusivamente a uma das outras localidades do ABC:
 * - Diadema
 * - Mauá
 * - São Caetano do Sul
 * - Ribeirão Pires
 * 
 * Regra de exclusão estrita:
 * - NÃO se aplica a Ibirapuera
 * - NÃO se aplica a outras localidades de São Paulo (capital)
 * - NÃO se aplica a Santo André
 * - NÃO se aplica a São Bernardo do Campo
 * - NÃO se aplica a outras regiões fora dessas 4 cidades
 */
export function isSpecialAbcPaymentCity(location?: BookingSelectedLocation | null): boolean {
  if (!location) return false;

  const locId = (location.locationId || '').toLowerCase().trim();
  const locName = (location.locationName || '').toLowerCase().trim();
  const city = (location.city || '').toLowerCase().trim();

  // 1. Exclusão explícita: Ibirapuera
  if (locId === 'ibirapuera' || locName.includes('ibirapuera')) return false;

  // 2. Exclusão explícita: São Paulo capital
  if (location.region === 'sao_paulo' || locId.startsWith('sp_') || city === 'são paulo' || city === 'sao paulo') {
    return false;
  }

  // 3. Exclusão explícita: Santo André
  if (locId === 'santo_andre' || city === 'santo andré' || city === 'santo andre') return false;

  // 4. Exclusão explícita: São Bernardo do Campo
  if (
    locId === 'sao_bernardo' ||
    city === 'são bernardo do campo' ||
    city === 'sao bernardo do campo' ||
    city === 'são bernardo' ||
    city === 'sao bernardo'
  ) {
    return false;
  }

  // Normalização sem acentos para correspondência exata e segura
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .trim();

  const normCity = normalize(city);
  const normLocName = normalize(locName);
  const normLocId = normalize(locId);

  const isDiadema = normCity.includes('diadema') || normLocName.includes('diadema') || normLocId.includes('diadema');
  const isMaua = normCity.includes('maua') || normLocName.includes('maua') || normLocId.includes('maua');
  const isSaoCaetano =
    normCity.includes('sao caetano') ||
    normLocName.includes('sao caetano') ||
    normLocId.includes('sao caetano');
  const isRibeiraoPires =
    normCity.includes('ribeirao pires') ||
    normLocName.includes('ribeirao pires') ||
    normLocId.includes('ribeirao pires');

  return isDiadema || isMaua || isSaoCaetano || isRibeiraoPires;
}


