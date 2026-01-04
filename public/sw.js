// This is a placeholder file to resolve 404 errors for sw.js
// These requests are usually residual registrations from previous projects on the same port.
// By providing this file, we silence the console errors.

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    self.registration.unregister()
        .then(() => self.clients.matchAll())
        .then(clients => {
            clients.forEach(client => client.navigate(client.url));
        });
});
