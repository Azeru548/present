const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
};

const TARGET_ACCURACY_M = 30;
const MAX_ACCURACY_M = 80;
const WATCH_MS = 12000;
const JITTER_M = 15;
const CACHE_KEY = 'present_geo_fix';
const CACHE_MS = 90_000;

export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function readCache() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '');
    if (!parsed?.lat || Date.now() - parsed.at > CACHE_MS) return null;
    if (parsed.accuracy > MAX_ACCURACY_M) return null;
    return { lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy };
  } catch {
    return null;
  }
}

function writeCache(pos) {
  if (typeof sessionStorage === 'undefined' || !pos) return;
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...pos, at: Date.now() })
    );
  } catch {
    // quota / private mode
  }
}

function mapGeoError(err) {
  const code = err?.code;
  if (code === 1) {
    return new Error(
      'Location permission was denied. Allow location access and turn on Precise Location, then try again.'
    );
  }
  if (code === 2) {
    return new Error(
      'Location is unavailable. Turn on GPS/Precise Location, enable Wi-Fi, and try again near a window.'
    );
  }
  if (code === 3) {
    return new Error(
      'Location timed out. Turn on Precise Location and try again.'
    );
  }
  return new Error(err?.message || 'Could not get your location.');
}

function toSample(pos) {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: Number(pos.coords.accuracy) || 9999,
  };
}

// Watch GPS for a few seconds and keep the most accurate sample.
// The first browser callback is often a coarse Wi-Fi/IP guess that jumps
// 100–200 m every time the app opens.
export async function getCurrentPosition({
  onUpdate,
  allowCache = false,
  maxWaitMs = WATCH_MS,
  targetAccuracy = TARGET_ACCURACY_M,
} = {}) {
  if (allowCache) {
    const cached = readCache();
    if (cached) return cached;
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported on this device.');
  }

  return new Promise((resolve, reject) => {
    let best = null;
    let settled = false;
    let watchId = null;
    let timer = null;

    function finish(err) {
      if (settled) return;
      settled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      if (timer) clearTimeout(timer);
      if (best) {
        writeCache(best);
        resolve(best);
        return;
      }
      reject(
        err ||
          new Error(
            'Could not get your location. Please enable GPS and Precise Location, then try again.'
          )
      );
    }

    function onPos(raw) {
      const sample = toSample(raw);
      if (!best || sample.accuracy < best.accuracy) {
        best = sample;
        onUpdate?.(best);
      }
      if (best.accuracy <= targetAccuracy) finish();
    }

    function onErr(err) {
      if (err?.code === 1) {
        finish(mapGeoError(err));
        return;
      }
      if (best) finish();
    }

    try {
      navigator.geolocation.getCurrentPosition(onPos, onErr, GEO_OPTIONS);
      watchId = navigator.geolocation.watchPosition(onPos, onErr, GEO_OPTIONS);
    } catch (err) {
      finish(mapGeoError(err));
      return;
    }

    timer = setTimeout(() => finish(), maxWaitMs);
  });
}

export function assertPreciseLocation(pos, maxAccuracy = MAX_ACCURACY_M) {
  const acc = Math.round(pos?.accuracy || 9999);
  if (!pos || acc > maxAccuracy) {
    throw new Error(
      `Location is too imprecise (±${acc}m). Turn on Precise Location (not Approximate), keep the app open for a few seconds, and try again. The installed Present app usually gets a better lock than the browser site.`
    );
  }
  return pos;
}

export function isWithinRange(studentPos, sessionPos, maxMeters) {
  const distance = getDistance(
    studentPos.lat,
    studentPos.lng,
    sessionPos.lat,
    sessionPos.lng
  );
  const pad =
    Math.min(studentPos.accuracy || 0, 40) +
    Math.min(sessionPos.accuracy || 0, 40);
  const allowed = maxMeters + Math.min(pad, 40) + JITTER_M;
  return {
    within: distance <= allowed,
    distance: Math.round(distance),
    accuracy: Math.round(studentPos.accuracy || 0),
    allowed: Math.round(allowed),
  };
}

export { MAX_ACCURACY_M };
