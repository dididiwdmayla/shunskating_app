const CACHE_NAME = 'shunskating-v2';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/tricks.js',
    '/js/skate-game.js',
    '/js/metas.js',
    '/js/highlights.js',
    '/data/tricks.json',
    '/assets/images/logoshun.png',
    '/assets/images/background_concrete.png',
    '/assets/images/background_graffiti.png',
    '/assets/images/splatter_red1.png',
    '/assets/images/splatter_red2.png',
    '/assets/images/splatter_black.png',
    '/assets/images/scratch_texture.png',
    '/assets/images/spray_drip.png',
    '/assets/images/tag_decorative.png',
    '/assets/images/sticker_torn.png',
    '/assets/audio/uiclick.wav',
    '/assets/audio/smoothwoosh.wav',
    '/assets/audio/uiswipeback.wav',
    '/assets/audio/uifilteractivatesmoothclick.wav',
    '/assets/audio/savesucess.wav',
    '/assets/audio/gamecoinflip.wav',
    '/assets/audio/gameyourturn.wav',
    '/assets/audio/gameletternegativegained.wav',
    '/assets/audio/victorysound.mp3',
    '/assets/audio/awwdefeatsound.wav',
    '/assets/audio/skate pop_1.mp3',
    '/assets/audio/skatepopfail_1.mp3',
    '/assets/audio/skate som de flip.mp3',
    '/assets/audio/skate 360 flip_1.mp3',
    '/assets/audio/skatesom-slide.mp3',
    '/assets/audio/skatesom grindi.mp3',
    '/assets/audio/comemoracaoyeah.wav',
    '/assets/audio/frustration.wav'
];

// Instala o service worker e cacheia os arquivos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto, adicionando arquivos...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('Todos os arquivos foram cacheados!');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Erro ao cachear arquivos:', error);
            })
    );
});

// Ativa o service worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Intercepta requisições e serve do cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Se encontrou no cache, retorna
                if (response) {
                    return response;
                }
                // Se não, busca na rede
                return fetch(event.request);
            })
            .catch(() => {
                // Se offline e não tem cache, retorna página offline
                console.log('Offline e sem cache para:', event.request.url);
            })
    );
});

