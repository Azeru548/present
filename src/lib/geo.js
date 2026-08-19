const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
};

const TARGET_ACCURACY_M = 40;
const WATCH_MS = 10000;
const CITY_LEVEL_M = 2500;
const JITTER_M = 20;
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
    if ((parsed.accuracy || 9999) > CITY_LEVEL_M) return null;
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
      'Location permission was denied. Allow location access and try again.'
    );
  }
  if (code === 2) {
    return new Error(
      'Location is unavailable. Turn on location services and try again.'
    );
  }
  if (code === 3) {
    return new Error('Location timed out. Try again in a moment.');
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
            'Could not get your location. Allow location access and try again.'
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

export function isCityLevel(pos) {
  return !pos || (pos.accuracy || 9999) > CITY_LEVEL_M;
}

export function assertUsableLocation(pos) {
  if (isCityLevel(pos)) {
    throw new Error(
      `Location looks city-wide (±${Math.round(pos?.accuracy || 0)}m), not a campus pin. Turn on location access and try again.`
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
  const studentPad = Math.min(Number(studentPos.accuracy) || 0, 250);
  const allowed = Number(maxMeters) + studentPad + JITTER_M;
  return {
    within: distance <= allowed,
    distance: Math.round(distance),
    accuracy: Math.round(studentPos.accuracy || 0),
    allowed: Math.round(allowed),
  };
}

export function proximityLabel(studentPos, session) {
  if (!studentPos || !session?.location) return { key: 'unknown', text: 'Location unavailable' };
  const result = isWithinRange(
    studentPos,
    session.location,
    session.location.radius
  );
  if (result.within) return { key: 'in', text: 'In range' };
  if (result.distance <= session.location.radius * 3) return { key: 'near', text: 'Nearby' };
  return { key: 'far', text: 'Far from class' };
}
