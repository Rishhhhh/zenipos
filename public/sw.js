// ZeniPOS Service Worker v3 - Advanced Caching & Offline Support
const CACHE_NAME = 'zenipos-v3';
const IMAGE_CACHE = 'zenipos-images-v2';
const API_CACHE = 'zenipos-api-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logos/zenipos-full-color.svg',
  '/logos/zenipos-full-white.svg',
  '/logos/zenipos-icon-color.png',
  '/logos/zenipos-icon-black.svg',
  '/logos/zenipos-icon-white.svg',
];

// Critical routes to pre-cache
const CRITICAL_ROUTES = [
  '/pos',
  '/kds',
  '/admin',
];

// API caching strategies with TTL (in milliseconds)
const CACHE_STRATEGIES = {
  'menu_items': { ttl: 300000, strategy: 'stale-while-revalidate' }, // 5 min
  'menu_categories': { ttl: 300000, strategy: 'stale-while-revalidate' },
  'orders': { ttl: 10000, strategy: 'network-first' }, // 10 sec
  'employees': { ttl: 600000, strategy: 'cache-first' }, // 10 min
};

// Install event: cache static assets + critical routes
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 [SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 [SW] Pre-caching critical routes');
        return cache.addAll(CRITICAL_ROUTES.map(route => route));
      })
    ])
  );
  self.skipWaiting();
});

// Activate event: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE && name !== API_CACHE)
          .map((name) => {
            console.log('🗑️ [SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Intelligent API caching for Supabase
  if (url.hostname.includes('supabase') && url.pathname.includes('/rest/v1/')) {
    const tableName = extractTableName(url.pathname);
    const strategy = CACHE_STRATEGIES[tableName];
    
    if (strategy) {
      if (strategy.strategy === 'stale-while-revalidate') {
        event.respondWith(staleWhileRevalidate(request, tableName));
        return;
      } else if (strategy.strategy === 'network-first') {
        event.respondWith(networkFirst(request));
        return;
      } else if (strategy.strategy === 'cache-first') {
        event.respondWith(cacheFirst(request));
        return;
      }
    }
    // Default: network only for non-cached tables
    return event.respondWith(fetch(request));
  }

  // Images: Cache-first with stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);
          
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Static assets: Cache-first
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((response) => {
          if (response.ok) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: Network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || caches.match('/index.html');
        });
      })
  );
});

// Background sync for offline orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

async function syncOfflineOrders() {
  console.log('[SW] Syncing offline orders...');
  // Actual sync logic handled by offlineQueue.ts
  // Send message to all clients to trigger sync
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_ORDERS' });
  });
}

// Helper: Extract table name from Supabase URL
function extractTableName(pathname) {
  const match = pathname.match(/\/rest\/v1\/([^?]+)/);
  return match ? match[1] : null;
}

// Strategy: Stale-while-revalidate
async function staleWhileRevalidate(request, tableName) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      const clone = response.clone();
      const strategy = CACHE_STRATEGIES[tableName];
      
      // Add cache metadata
      const responseWithMeta = new Response(await clone.blob(), {
        status: clone.status,
        statusText: clone.statusText,
        headers: {
          ...Object.fromEntries(clone.headers.entries()),
          'sw-cached-at': Date.now().toString(),
          'sw-ttl': strategy.ttl.toString()
        }
      });
      
      cache.put(request, responseWithMeta);
    }
    return response;
  }).catch(() => cached);
  
  // Return cached if available, fetch in background
  return cached || fetchPromise;
}

// Strategy: Network-first with cache fallback
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(API_CACHE);
    const cached = await cache.match(request);
    if (cached) {
      console.log('[SW] Returning cached response for:', request.url);
      return cached;
    }
    throw error;
  }
}

// Strategy: Cache-first with background refresh
async function cacheFirst(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Check if cache is stale
    const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0');
    const ttl = parseInt(cached.headers.get('sw-ttl') || '0');
    const age = Date.now() - cachedAt;
    
    if (age < ttl) {
      // Fresh cache, return immediately
      return cached;
    }
    
    // Stale cache, refresh in background
    fetch(request).then(response => {
      if (response.ok) cache.put(request, response);
    });
    
    return cached;
  }
  
  // No cache, fetch from network
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/logos/zenipos-icon-color.png',
    badge: data.badge || '/logos/zenipos-icon-color.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'ZeniPOS',
      options
    )
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/admin/manager')
    );
  }
});
