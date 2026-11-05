import http from 'k6/http';
import { check, group, sleep } from 'k6';

// Scénario de test de charge progressif Jaaymaa 🇸🇳
export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Palier 1 : 100 utilisateurs simultanés
    { duration: '2m', target: 500 },   // Palier 2 : 500 utilisateurs simultanés
    { duration: '3m', target: 1000 },  // Palier 3 : 1 000 utilisateurs simultanés
    { duration: '2m', target: 5000 },  // Palier 4 : Pic exceptionnel 5 000 VU
    { duration: '1m', target: 0 },     // Redescente à zéro
  ],
  thresholds: {
    'http_req_duration{type:storefront}': ['p(95)<350'], // 95% des requêtes vitrine < 350ms
    'http_req_duration{type:checkout}': ['p(95)<900'],   // 95% des checkouts < 900ms
    'http_req_failed': ['rate<0.01'],                    // Taux d'échec global < 1%
  },
};

const BASE_URL = __ENV.TARGET_URL || 'https://jaayma-sn.jaayma.workers.dev';

export default function loadTest() {
  group('1. Consultation Boutique Vitrine', () => {
    const res = http.get(`${BASE_URL}/explorer`, {
      tags: { type: 'storefront' },
    });
    check(res, {
      'Explorer statut 200': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 2 + 1);

  group('2. Consultation Détail Boutique', () => {
    const res = http.get(`${BASE_URL}/awa-couture`, {
      tags: { type: 'storefront' },
    });
    check(res, {
      'Boutique statut 200': (r) => r.status === 200 || r.status === 404,
    });
  });

  sleep(Math.random() * 2 + 1);

  group('3. Simulation Checkout Commande', () => {
    const payload = JSON.stringify({
      shopSlug: 'awa-couture',
      customerName: 'Fatou Ndiaye',
      customerPhone: '+221774451982',
      deliveryAddress: 'Dakar, Point E rue 5',
      paymentMethod: 'cash',
      items: [{ productId: 'demo-prod-1', quantity: 1 }],
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
      tags: { type: 'checkout' },
    };

    const res = http.post(`${BASE_URL}/api/checkout`, payload, params);
    check(res, {
      'Réponse commande valide': (r) => r.status === 200 || r.status === 201 || r.status === 400,
    });
  });

  sleep(Math.random() * 3 + 2);
}

