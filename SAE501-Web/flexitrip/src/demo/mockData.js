/**
 * Données MOCK pour le mode DEMO
 * Source de vérité : SAE501-API_Flexitrip/db/schema.sql
 */

// ==================== UTILISATEUR ====================
const MOCK_USER = {
  user_id: 'demo-user-1',
  email: 'pmr@demo.com',
  role: 'PMR',
  name: 'Martin',
  surname: 'Dupont',
  phone: '+33612345678',
  enrollment_status: 'complete'
};

// ==================== AGENTS ====================
const MOCK_AGENTS = [
  {
    id: 'agent-1',
    user_id: 'agent-user-1',
    name: 'Marie',
    surname: 'Lefevre',
    email: 'marie.lefevre@flexitrip.com',
    phone: '+33612111111',
    specialty: 'TRAIN',
    available: true,
    current_location: 'Paris Gare de Lyon'
  },
  {
    id: 'agent-2',
    user_id: 'agent-user-2',
    name: 'Claude',
    surname: 'Petit',
    email: 'claude.petit@flexitrip.com',
    phone: '+33612222222',
    specialty: 'BUS',
    available: true,
    current_location: 'Lyon Perrache'
  },
  {
    id: 'agent-3',
    user_id: 'agent-user-3',
    name: 'Sophie',
    surname: 'Durand',
    email: 'sophie.durand@flexitrip.com',
    phone: '+33612333333',
    specialty: 'FLIGHT',
    available: true,
    current_location: 'Marseille Provence'
  }
];

// ==================== VOYAGE MULTIMODAL ====================
const MOCK_VOYAGE_MULTIMODAL = {
  id_voyage: 'voyage-demo-1',
  user_id: 'demo-user-1',
  depart: 'Paris Gare de Lyon',
  arrivee: 'Nice Côte d\'Azur',
  lieu_depart: 'Paris Gare de Lyon',
  lieu_arrivee: 'Nice Côte d\'Azur',
  Lieu_depart: 'Paris Gare de Lyon',
  Lieu_arrivee: 'Nice Côte d\'Azur',
  date_debut: '2026-01-29T08:00:00Z',
  date_fin: '2026-01-29T15:50:00Z',
  Date_depart: '2026-01-29T08:00:00Z',
  Date_arrivee: '2026-01-29T15:50:00Z',
  status: 'confirmed',
  total_price: 195,
  num_reza_mmt: 'FXT-2026-001',
  
  // Étapes du voyage (multimodal)
  etapes: [
    {
      type: 'TRAIN',
      transport: 'TRAIN',
      compagnie: 'SNCF TGV',
      adresse_1: 'Paris Gare de Lyon',
      adresse_2: 'Lyon Part-Dieu',
      id: 'etape-1',
      ordre: 1,
      depart_time: '2026-01-29T08:00:00Z',
      arrivee_time: '2026-01-29T10:00:00Z',
      duration: 120,
      price: 50,
      agent_id: 'agent-1',
      handover_status: 'completed',
      etape_data: {
        train_number: 'TGV 6601',
        seat: '12A',
        car: '11',
        accessible_pmr: true
      }
    },
    {
      type: 'BUS',
      transport: 'BUS',
      compagnie: 'FlixBus',
      adresse_1: 'Lyon Perrache',
      adresse_2: 'Marseille Gare Saint-Charles',
      id: 'etape-2',
      ordre: 2,
      depart_time: '2026-01-29T10:30:00Z',
      arrivee_time: '2026-01-29T13:30:00Z',
      duration: 180,
      price: 25,
      agent_id: 'agent-2',
      handover_status: 'in_progress',
      etape_data: {
        bus_number: 'FB 1234',
        seat: '5A',
        accessible_pmr: true
      }
    },
    {
      type: 'FLIGHT',
      transport: 'FLIGHT',
      compagnie: 'Air France',
      adresse_1: 'Marseille Provence Airport (MRS)',
      adresse_2: 'Nice Côte d\'Azur Airport (NCE)',
      id: 'etape-3',
      ordre: 3,
      depart_time: '2026-01-29T15:00:00Z',
      arrivee_time: '2026-01-29T15:50:00Z',
      duration: 50,
      price: 120,
      agent_id: 'agent-3',
      handover_status: 'pending',
      etape_data: {
        flight_number: 'AF 7710',
        seat: '8C',
        gate: 'B12',
        terminal: '1',
        accessible_pmr: true
      }
    }
  ]
};

// ==================== BAGAGES ====================
const MOCK_BAGAGES = [
  {
    bagage_id: 'bag-1',
    reservation_id: 'voyage-demo-1',
    user_id: 'demo-user-1',
    bagage_type: 'soute',
    bagage_public_id: 'FXT-BAG-001',
    poids_kg: 20,
    fragile: false,
    assistance_required: true,
    status: 'in_transit',
    current_location: 'Lyon Part-Dieu',
    created_at: '2026-01-29T07:00:00Z',
    reservation: {
      num_reza_mmt: 'FXT-2026-001',
      Lieu_depart: 'Paris',
      Lieu_arrivee: 'Nice'
    }
  },
  {
    bagage_id: 'bag-2',
    reservation_id: 'voyage-demo-1',
    user_id: 'demo-user-1',
    bagage_type: 'cabin',
    bagage_public_id: 'FXT-BAG-002',
    poids_kg: 8,
    fragile: true,
    assistance_required: false,
    status: 'checked_in',
    current_location: 'Paris Gare de Lyon',
    created_at: '2026-01-29T07:00:00Z',
    reservation: {
      num_reza_mmt: 'FXT-2026-001',
      Lieu_depart: 'Paris',
      Lieu_arrivee: 'Nice'
    }
  }
];

// Événements timeline bagage
const MOCK_BAGAGE_EVENTS = {
  'bag-1': [
    { event_type: 'TAG_PRINTED', location: 'Paris Gare de Lyon - Hall 1', timestamp: '2026-01-29T07:00:00Z', operator: 'Marie Lefevre' },
    { event_type: 'DROP_OFF', location: 'Paris Gare de Lyon - Desk PMR', timestamp: '2026-01-29T07:30:00Z', operator: 'Marie Lefevre' },
    { event_type: 'LOADED_TRAIN', location: 'TGV 6601 - Wagon Bagages', timestamp: '2026-01-29T07:45:00Z', operator: 'System' },
    { event_type: 'TRANSFER', location: 'Lyon Part-Dieu - Zone Transfer', timestamp: '2026-01-29T10:00:00Z', operator: 'Claude Petit' }
  ],
  'bag-2': [
    { event_type: 'TAG_PRINTED', location: 'Paris Gare de Lyon - Hall 1', timestamp: '2026-01-29T07:00:00Z', operator: 'Marie Lefevre' },
    { event_type: 'CHECK_IN', location: 'Paris Gare de Lyon - Check-in PMR', timestamp: '2026-01-29T07:30:00Z', operator: 'Marie Lefevre' }
  ]
};

// ==================== WALLET & TRANSACTIONS ====================
const MOCK_WALLET_BALANCE = 105;

const MOCK_TRANSACTIONS = [
  {
    id: 'tx-1',
    transaction_id: 'tx-1',
    user_id: 'demo-user-1',
    date: '2026-01-28T10:00:00Z',
    description: 'Recharge wallet DEMO',
    amount: 100,
    currency: 'EUR',
    type: 'Recharge',
    direction: 'credit',
    status: 'completed'
  },
  {
    id: 'tx-2',
    transaction_id: 'tx-2',
    user_id: 'demo-user-1',
    date: '2026-01-29T08:00:00Z',
    description: 'Paiement voyage Paris-Nice',
    amount: -195,
    currency: 'EUR',
    type: 'Débit',
    direction: 'debit',
    status: 'completed',
    related_voyage_id: 'voyage-demo-1'
  },
  {
    id: 'tx-3',
    transaction_id: 'tx-3',
    user_id: 'demo-user-1',
    date: '2026-01-29T07:15:00Z',
    description: 'Paiement bagages (x2)',
    amount: -30,
    currency: 'EUR',
    type: 'Débit',
    direction: 'debit',
    status: 'completed'
  },
  {
    id: 'tx-4',
    transaction_id: 'tx-4',
    user_id: 'demo-user-1',
    date: '2026-01-26T14:30:00Z',
    description: 'Recharge initiale',
    amount: 200,
    currency: 'EUR',
    type: 'Recharge',
    direction: 'credit',
    status: 'completed'
  }
];

// ==================== BOARDING PASS ====================
const MOCK_BOARDING_PASSES = [
  {
    id: 'bp-1',
    boarding_pass_id: 'bp-1',
    reservation_id: 'voyage-demo-1',
    etape_id: 'etape-1',
    passenger_name: 'Martin Dupont',
    transport_type: 'TRAIN',
    operator: 'SNCF TGV',
    transport_number: 'TGV 6601',
    seat: '12A',
    car: '11',
    gate: 'K',
    departure: 'Paris Gare de Lyon',
    destination: 'Lyon Part-Dieu',
    departure_time: '2026-01-29T08:00:00Z',
    boarding_time: '2026-01-29T07:30:00Z',
    status: 'issued',
    qr_code: JSON.stringify({
      boarding_pass_id: 'bp-1',
      passenger: 'Martin Dupont',
      transport: 'TGV 6601',
      seat: '12A',
      car: '11',
      gate: 'K',
      departure: 'Paris Gare de Lyon',
      destination: 'Lyon Part-Dieu',
      boarding_time: '07:30'
    }),
    created_at: '2026-01-28T10:00:00Z'
  },
  {
    id: 'bp-2',
    boarding_pass_id: 'bp-2',
    reservation_id: 'voyage-demo-1',
    etape_id: 'etape-2',
    passenger_name: 'Martin Dupont',
    transport_type: 'BUS',
    operator: 'FlixBus',
    transport_number: 'FB 1234',
    seat: '5A',
    departure: 'Lyon Perrache',
    destination: 'Marseille Gare',
    departure_time: '2026-01-29T10:30:00Z',
    boarding_time: '2026-01-29T10:15:00Z',
    status: 'issued',
    qr_code: JSON.stringify({
      boarding_pass_id: 'bp-2',
      passenger: 'Martin Dupont',
      transport: 'FB 1234',
      seat: '5A',
      departure: 'Lyon Perrache',
      destination: 'Marseille Gare',
      boarding_time: '10:15'
    }),
    created_at: '2026-01-28T10:00:00Z'
  },
  {
    id: 'bp-3',
    boarding_pass_id: 'bp-3',
    reservation_id: 'voyage-demo-1',
    etape_id: 'etape-3',
    passenger_name: 'Martin Dupont',
    transport_type: 'FLIGHT',
    operator: 'Air France',
    transport_number: 'AF 7710',
    seat: '8C',
    gate: 'B12',
    terminal: '1',
    departure: 'Marseille Provence (MRS)',
    destination: 'Nice Côte d\'Azur (NCE)',
    departure_time: '2026-01-29T15:00:00Z',
    boarding_time: '2026-01-29T14:15:00Z',
    status: 'issued',
    qr_code: JSON.stringify({
      boarding_pass_id: 'bp-3',
      passenger: 'Martin Dupont',
      flight: 'AF 7710',
      seat: '8C',
      gate: 'B12',
      terminal: '1',
      departure: 'Marseille Provence',
      destination: 'Nice Côte d\'Azur',
      boarding_time: '14:15'
    }),
    created_at: '2026-01-28T10:00:00Z'
  }
];

// ==================== CHECK-IN ====================
const MOCK_CHECKIN = {
  checkin_id: 'checkin-1',
  reservation_id: 'voyage-demo-1',
  user_id: 'demo-user-1',
  status: 'completed',
  checked_in_at: '2026-01-29T07:00:00Z',
  kiosk_location: 'Paris Gare de Lyon - Borne Check-in PMR Hall 2',
  enrollment_verified: true
};

// ==================== NOTIFICATIONS ====================
const MOCK_NOTIFICATIONS = [
  {
    notification_id: 'notif-1',
    user_id: 'demo-user-1',
    title: 'Agent Marie en route',
    message: 'Votre agent Marie Lefevre arrive dans 5 minutes au point de rendez-vous',
    type: 'agent_update',
    is_read: false,
    created_at: new Date(Date.now() - 300000).toISOString() // Il y a 5 min
  },
  {
    notification_id: 'notif-2',
    user_id: 'demo-user-1',
    title: 'Check-in confirmé',
    message: 'Votre check-in a été validé avec succès. Boarding pass disponible.',
    type: 'checkin',
    is_read: true,
    created_at: new Date(Date.now() - 7200000).toISOString() // Il y a 2h
  },
  {
    notification_id: 'notif-3',
    user_id: 'demo-user-1',
    title: 'Bagage enregistré',
    message: 'Votre bagage FXT-BAG-001 a été pris en charge',
    type: 'bagage',
    is_read: true,
    created_at: new Date(Date.now() - 7500000).toISOString()
  },
  {
    notification_id: 'notif-4',
    user_id: 'demo-user-1',
    title: 'Correspondance à Lyon',
    message: 'Votre agent Claude vous attend à Lyon Perrache pour la correspondance bus',
    type: 'handover',
    is_read: false,
    created_at: new Date(Date.now() - 600000).toISOString()
  }
];

// ==================== PRISE EN CHARGE ====================
const MOCK_PRISE_EN_CHARGE = {
  id: 'pec-1',
  reservation_id: 'voyage-demo-1',
  etape_id: 'etape-2',
  agent_id: 'agent-2',
  pmr_user_id: 'demo-user-1',
  status: 'in_progress',
  meeting_point: 'Lyon Perrache - Sortie Bus PMR',
  confirmed_at: '2026-01-29T10:05:00Z',
  estimated_arrival: '2026-01-29T10:20:00Z'
};

// ==================== ROUTER DE MOCK DATA ====================
/**
 * Retourne les données mock appropriées selon l'endpoint
 * @param {string} endpoint - L'endpoint appelé (ex: '/voyages/history')
 * @param {string} method - La méthode HTTP (get, post, put, delete)
 * @param {object} data - Les données envoyées (pour POST/PUT)
 * @returns {object} - Les données mock correspondantes
 */
export const getMockData = (endpoint, method = 'get', data = null) => {
  console.log(`[MOCK DATA] ${method.toUpperCase()} ${endpoint}`, data);

  const normalizedEndpoint = endpoint.replace(/^\/api/, ''); // Enlever /api si présent

  // ========== AUTHENTIFICATION ==========
  if (normalizedEndpoint === '/auth/login' && method === 'post') {
    return {
      success: true,
      token: 'demo-jwt-token-' + Date.now(),
      user: MOCK_USER
    };
  }

  if (normalizedEndpoint === '/auth/me' || normalizedEndpoint === '/users/login') {
    return MOCK_USER;
  }

  if (normalizedEndpoint.match(/^\/users\/[^/]+$/) && method === 'get') {
    return MOCK_USER;
  }

  // ========== VOYAGES ==========
  if (normalizedEndpoint === '/voyages/history' || normalizedEndpoint === '/voyages') {
    return {
      success: true,
      voyages: [MOCK_VOYAGE_MULTIMODAL],
      count: 1
    };
  }

  if (normalizedEndpoint.match(/^\/voyages\/details\/[^/]+$/) || normalizedEndpoint.match(/^\/voyages\/[^/]+$/)) {
    return {
      success: true,
      voyage: MOCK_VOYAGE_MULTIMODAL,
      ...MOCK_VOYAGE_MULTIMODAL
    };
  }

  // ========== RECHERCHE MULTIMODALE ==========
  if (normalizedEndpoint === '/search/multimodal' || normalizedEndpoint.includes('/search')) {
    return {
      success: true,
      total: 1,
      itineraries: [MOCK_VOYAGE_MULTIMODAL],
      results: [MOCK_VOYAGE_MULTIMODAL]
    };
  }

  // ========== RÉSERVATIONS ==========
  if (normalizedEndpoint.startsWith('/reservations') || normalizedEndpoint.includes('/booking')) {
    if (method === 'post') {
      return {
        success: true,
        reservation: {
          reservation_id: 'voyage-demo-1',
          num_reza_mmt: 'FXT-2026-001',
          ...MOCK_VOYAGE_MULTIMODAL
        }
      };
    }
    return {
      success: true,
      reservation: MOCK_VOYAGE_MULTIMODAL
    };
  }

  // ========== BAGAGES ==========
  if (normalizedEndpoint === '/bagages' && method === 'get') {
    return {
      success: true,
      bagages: MOCK_BAGAGES,
      count: MOCK_BAGAGES.length
    };
  }

  if (normalizedEndpoint === '/bagages' && method === 'post') {
    const newBagage = {
      bagage_id: 'bag-' + Date.now(),
      bagage_public_id: 'FXT-BAG-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
      ...data,
      status: 'created',
      created_at: new Date().toISOString()
    };
    return {
      success: true,
      bagage: newBagage
    };
  }

  if (normalizedEndpoint.match(/^\/bagages\/[^/]+$/)) {
    const bagageId = normalizedEndpoint.split('/')[2];
    const bagage = MOCK_BAGAGES.find(b => b.bagage_id === bagageId) || MOCK_BAGAGES[0];
    return {
      success: true,
      bagage: bagage
    };
  }

  if (normalizedEndpoint.match(/^\/bagages\/[^/]+\/timeline$/)) {
    const bagageId = normalizedEndpoint.split('/')[2];
    return {
      success: true,
      events: MOCK_BAGAGE_EVENTS[bagageId] || MOCK_BAGAGE_EVENTS['bag-1']
    };
  }

  if (normalizedEndpoint === '/bagages/scan' && method === 'post') {
    return {
      success: true,
      message: 'Bagage scanné avec succès',
      bagage: MOCK_BAGAGES[0],
      event_created: true
    };
  }

  // ========== WALLET & BLOCKCHAIN ==========
  if (normalizedEndpoint === '/blockchain/balance') {
    return {
      success: true,
      balance: MOCK_WALLET_BALANCE,
      currency: 'EUR'
    };
  }

  if (normalizedEndpoint === '/blockchain/history' || normalizedEndpoint === '/transactions/history') {
    return {
      success: true,
      transactions: MOCK_TRANSACTIONS,
      count: MOCK_TRANSACTIONS.length
    };
  }

  if (normalizedEndpoint === '/transactions/pay' && method === 'post') {
    return {
      success: true,
      transaction: {
        transaction_id: 'tx-' + Date.now(),
        amount: -data.amount,
        new_balance: MOCK_WALLET_BALANCE - data.amount,
        status: 'completed',
        created_at: new Date().toISOString()
      }
    };
  }

  // ========== CHECK-IN ==========
  if (normalizedEndpoint.includes('/checkin')) {
    if (normalizedEndpoint.includes('/scan') || normalizedEndpoint.includes('/manual') || method === 'post') {
      return {
        success: true,
        checkin: MOCK_CHECKIN,
        boarding_pass: MOCK_BOARDING_PASSES[0],
        message: 'Check-in effectué avec succès'
      };
    }
    if (normalizedEndpoint.includes('/status')) {
      return {
        success: true,
        checkin: MOCK_CHECKIN
      };
    }
    return { success: true, checkin: MOCK_CHECKIN };
  }

  // ========== BOARDING PASS ==========
  if (normalizedEndpoint.includes('/boarding')) {
    return {
      success: true,
      boarding_passes: MOCK_BOARDING_PASSES,
      count: MOCK_BOARDING_PASSES.length
    };
  }

  // ========== NOTIFICATIONS ==========
  if (normalizedEndpoint === '/notification' || normalizedEndpoint === '/notifications') {
    if (method === 'delete') {
      return { success: true, message: 'Notification supprimée' };
    }
    if (normalizedEndpoint.includes('/count')) {
      return {
        success: true,
        count: MOCK_NOTIFICATIONS.filter(n => !n.is_read).length
      };
    }
    return {
      success: true,
      notifications: MOCK_NOTIFICATIONS,
      count: MOCK_NOTIFICATIONS.length
    };
  }

  // ========== AGENTS & ASSIGNMENT ==========
  if (normalizedEndpoint.startsWith('/intelligent-assignment') || normalizedEndpoint.includes('/dev')) {
    if (normalizedEndpoint.includes('/statistics')) {
      return {
        success: true,
        total_missions: 12,
        completed_today: 8,
        in_progress: 3,
        agents_available: 15
      };
    }
    if (normalizedEndpoint.includes('/available-agents')) {
      return {
        success: true,
        agents: MOCK_AGENTS
      };
    }
    if (normalizedEndpoint.includes('/monitor')) {
      return {
        success: true,
        missions: [{
          id: 'mission-1',
          agent: MOCK_AGENTS[1],
          pmr_user: MOCK_USER,
          status: 'in_progress'
        }]
      };
    }
    return { success: true, agents: MOCK_AGENTS };
  }

  if (normalizedEndpoint.startsWith('/auth/me/')) {
    if (normalizedEndpoint.includes('/qr')) {
      return {
        success: true,
        qr_code: JSON.stringify({ agent_id: 'agent-1', name: 'Marie Lefevre' })
      };
    }
    if (normalizedEndpoint.includes('/assignments')) {
      return {
        success: true,
        assignments: [{
          reservation_id: 'voyage-demo-1',
          pmr_name: 'Martin Dupont',
          status: 'in_progress'
        }]
      };
    }
  }

  // ========== PRISE EN CHARGE ==========
  if (normalizedEndpoint.startsWith('/prise-en-charge')) {
    if (normalizedEndpoint.includes('/validate')) {
      return {
        success: true,
        message: 'Prise en charge validée',
        prise_en_charge: { ...MOCK_PRISE_EN_CHARGE, status: 'completed' }
      };
    }
    if (normalizedEndpoint.includes('/approaching')) {
      return {
        success: true,
        message: 'Notification envoyée',
        timestamp: new Date().toISOString()
      };
    }
    return {
      success: true,
      prise_en_charge: MOCK_PRISE_EN_CHARGE,
      agent: MOCK_AGENTS[1],
      pmr_user: MOCK_USER
    };
  }

  // ========== ASSISTANCE PMR ==========
  if (normalizedEndpoint.startsWith('/assistance')) {
    return {
      success: true,
      mission: {
        id: 'mission-1',
        pmr_user: MOCK_USER,
        agent: MOCK_AGENTS[0],
        current_etape: MOCK_VOYAGE_MULTIMODAL.etapes[0],
        status: 'in_progress'
      }
    };
  }

  // ========== CHAT ==========
  if (normalizedEndpoint.includes('/chat')) {
    if (normalizedEndpoint.includes('/conversations') && method === 'post') {
      return {
        success: true,
        conversation_id: 'conv-demo-1',
        created_at: new Date().toISOString()
      };
    }
    if (normalizedEndpoint.includes('/messages')) {
      return {
        success: true,
        messages: [
          {
            message_id: 'msg-1',
            sender_id: 'agent-1',
            sender_name: 'Marie Lefevre',
            content: 'Bonjour, je suis votre agent pour ce trajet',
            timestamp: new Date(Date.now() - 600000).toISOString()
          }
        ]
      };
    }
    return { success: true };
  }

  // ========== DÉFAUT ==========
  console.warn(`⚠️ Endpoint mock non défini: ${normalizedEndpoint}`);
  return {
    success: true,
    message: 'Mock data not implemented for this endpoint',
    data: {}
  };
};

// Export des données brutes (pour tests)
export {
  MOCK_USER,
  MOCK_AGENTS,
  MOCK_VOYAGE_MULTIMODAL,
  MOCK_BAGAGES,
  MOCK_TRANSACTIONS,
  MOCK_BOARDING_PASSES,
  MOCK_CHECKIN,
  MOCK_NOTIFICATIONS
};
