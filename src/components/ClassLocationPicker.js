'use client';
import { useEffect, useRef, useState } from 'react';
import { getCurrentPosition } from '@/lib/geo';
import { friendlyError } from '@/lib/errors';
import styles from './ClassLocationPicker.module.css';
import 'leaflet/dist/leaflet.css';

export default function ClassLocationPicker({ radius = 50, value, onChange }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const [status, setStatus] = useState('Finding your location to drop a hint pin…');
  const [locating, setLocating] = useState(false);

  onChangeRef.current = onChange;
  valueRef.current = value;

  useEffect(() => {
    let cancelled = false;
    let map;

    (async () => {
      const leaflet = await import('leaflet');
      const L = leaflet.default || leaflet;
      if (cancelled || !hostRef.current) return;

      const start = valueRef.current;
      map = L.map(hostRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView(
        start?.lat ? [start.lat, start.lng] : [9.08, 8.68],
        start?.lat ? 17 : 6
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: styles.pin,
        html: '<span></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker(map.getCenter(), {
        draggable: true,
        icon: pinIcon,
      });
      const circle = L.circle(map.getCenter(), {
        radius: Number(radius) || 50,
        color: '#145d40',
        weight: 2,
        fillColor: '#1e7a54',
        fillOpacity: 0.12,
      });

      function emit(next) {
        marker.setLatLng([next.lat, next.lng]);
        circle.setLatLng([next.lat, next.lng]);
        onChangeRef.current?.(next);
      }

      if (start?.lat) {
        marker.addTo(map);
        circle.addTo(map);
        marker.setLatLng([start.lat, start.lng]);
        circle.setLatLng([start.lat, start.lng]);
      }

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        emit({
          lat,
          lng,
          accuracy: valueRef.current?.accuracy,
          source: 'map',
          confirmed: true,
        });
        setStatus('Pin placed by you. Confirm it sits on the classroom.');
      });

      map.on('click', (e) => {
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
          circle.addTo(map);
        }
        emit({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          source: 'map',
          confirmed: true,
        });
        setStatus('Pin placed by you. Confirm it sits on the classroom.');
      });

      mapRef.current = { L, map, marker, circle };
      map.invalidateSize();

      if (!start?.confirmed) {
        locateHint();
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
    // Map is created once; radius/value updates go through other effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const ctx = mapRef.current;
    if (!ctx?.circle) return;
    ctx.circle.setRadius(Number(radius) || 50);
  }, [radius]);

  async function locateHint() {
    setLocating(true);
    setStatus('Finding your location to drop a hint pin…');
    try {
      const pos = await getCurrentPosition({
        onUpdate: (sample) =>
          setStatus(`Hint pin ±${Math.round(sample.accuracy)}m — drag it onto the classroom.`),
      });
      const ctx = mapRef.current;
      const alreadyConfirmed = valueRef.current?.confirmed;
      if (!ctx || alreadyConfirmed) {
        setLocating(false);
        return;
      }
      const next = {
        lat: pos.lat,
        lng: pos.lng,
        accuracy: pos.accuracy,
        source: 'map',
        confirmed: false,
      };
      if (!ctx.map.hasLayer(ctx.marker)) {
        ctx.marker.addTo(ctx.map);
        ctx.circle.addTo(ctx.map);
      }
      ctx.marker.setLatLng([pos.lat, pos.lng]);
      ctx.circle.setLatLng([pos.lat, pos.lng]);
      ctx.map.setView([pos.lat, pos.lng], 17);
      onChangeRef.current?.(next);
      setStatus(
        `Hint pin is ±${Math.round(pos.accuracy)}m (browser GPS). Drag it onto the actual classroom, then confirm.`
      );
    } catch (err) {
      setStatus(
        friendlyError(
          err,
          'Could not guess your location. Tap the map to place the classroom pin.'
        )
      );
    } finally {
      setLocating(false);
    }
  }

  function handleConfirm(e) {
    const checked = e.target.checked;
    const current = valueRef.current;
    if (!current?.lat) return;
    onChangeRef.current?.({ ...current, confirmed: checked, source: 'map' });
  }

  return (
    <div className={styles.wrap}>
      <div ref={hostRef} className={styles.map} role="application" aria-label="Classroom map" />
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`btn-ghost ${styles.locate}`}
          onClick={locateHint}
          disabled={locating}
        >
          {locating ? 'Finding…' : 'Use my location as a hint'}
        </button>
      </div>
      <p className={styles.status}>{status}</p>
      <label className={styles.confirm}>
        <input
          type="checkbox"
          checked={!!value?.confirmed}
          disabled={!value?.lat}
          onChange={handleConfirm}
        />
        Pin is on the classroom
      </label>
      <p className={styles.hint}>
        GPS on a phone website is often ±100 m off. The pin you place is the class location students are checked against.
      </p>
    </div>
  );
}
