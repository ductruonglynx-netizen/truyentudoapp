export async function registerPhase4ServiceWorker(): Promise<{ ok: boolean; message: string }> {
  if (!('serviceWorker' in navigator)) {
    return { ok: false, message: 'Service Worker unsupported in this browser.' };
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return { ok: true, message: `Service Worker active at ${registration.scope}` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to register service worker.',
    };
  }
}

