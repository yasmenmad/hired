import React, { useState, useEffect, useRef } from 'react';
import { applications as appsApi, checkBackend } from '../../infrastructure/api/apiClient';

const SC  = {offer:'#0f7a4a',interview:'#8a5a0a',applied:'#5c35d4',saved:'#7c3aed',rejected:'#9a1f1f'};
const SBG = {offer:'#e4f7ee',interview:'#fdf3e0',applied:'#ede9fe',saved:'#ede9fe',rejected:'#fce8e8'};
const SL  = {offer:'Offer',interview:'Interviewing',applied:'Applied',saved:'Saved',rejected:'Rejected'};

// Load Leaflet from CDN
function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) { resolve(window.L); return; }
    // CSS
    if (!document.querySelector('#leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
}

// Geocode city names to lat/lng (hardcoded lookup for speed)
const GEOCODE = {
  'remote':             [20, 0],
  'san francisco':      [37.78, -122.41],
  'new york':           [40.71, -74.01],
  'london':             [51.51, -0.13],
  'paris':              [48.86, 2.35],
  'berlin':             [52.52, 13.40],
  'amsterdam':          [52.37, 4.90],
  'casablanca':         [33.57, -7.59],
  'rabat':              [34.02, -6.83],
  'dubai':              [25.20, 55.27],
  'toronto':            [43.65, -79.38],
  'austin':             [30.27, -97.74],
  'seattle':            [47.61, -122.33],
  'boston':             [42.36, -71.06],
  'chicago':            [41.88, -87.63],
  'singapore':          [1.35, 103.82],
  'tokyo':              [35.68, 139.69],
  'sydney':             [-33.87, 151.21],
  'bangalore':          [12.97, 77.59],
  'tel aviv':           [32.08, 34.78],
  'zurich':             [47.38, 8.54],
  'stockholm':          [59.33, 18.07],
  'madrid':             [40.42, -3.70],
  'barcelona':          [41.39, 2.15],
  'milan':              [45.46, 9.19],
  'oslo':               [59.91, 10.75],
  'lisbon':             [38.72, -9.14],
  'warsaw':             [52.23, 21.01],
  'prague':             [50.08, 14.44],
  'munich':             [48.14, 11.58],
  'montreal':           [45.50, -73.57],
  'los angeles':        [34.05, -118.24],
  'miami':              [25.77, -80.19],
  'denver':             [39.74, -104.98],
  'atlanta':            [33.75, -84.39],
};

function getLatLng(location = '') {
  if (!location) return [20, 0];
  const l = location.toLowerCase();
  for (const [key, coords] of Object.entries(GEOCODE)) {
    if (l.includes(key)) return coords;
  }
  // Remote jobs get a slight spread around center
  return [20 + (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 160];
}

export default function MapPage({ toast }) {
  const [pins, setPins] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    checkBackend().then(ok => {
      if (ok) loadApps();
      else { setLoading(false); useDemoData(); }
    });
  }, []);

  function useDemoData() {
    setPins([
      {id:1,company:'AstroAI',  title:'AI Engineer',      city:'San Francisco', lat:37.78,lng:-122.41,status:'offer',    salary:'$140–170k',match:96},
      {id:2,company:'Stripe',   title:'Product Manager',  city:'Paris',         lat:48.86,lng:2.35,   status:'interview',salary:'€95–120k', match:88},
      {id:3,company:'OCP Group',title:'Data Engineer',    city:'Casablanca',    lat:33.57,lng:-7.59,  status:'applied',  salary:'MAD 30–45k',match:71},
      {id:4,company:'Vercel',   title:'Frontend Engineer',city:'Remote',        lat:51.51,lng:-0.13,  status:'saved',    salary:'$130–155k',match:83},
      {id:5,company:'Datadog',  title:'Backend Engineer', city:'New York',      lat:40.71,lng:-74.01, status:'interview',salary:'$150–190k',match:79},
    ]);
  }

  async function loadApps() {
    setLoading(true);
    try {
      const data = await appsApi.list();
      const mapped = (data || []).map((app, i) => {
        const loc = app.job?.location || 'Remote';
        const [lat, lng] = getLatLng(loc);
        return {
          id: app.id, company: app.job?.company || 'Company',
          title: app.job?.title || 'Position', city: loc,
          lat: lat + (Math.random() - 0.5) * 0.8,
          lng: lng + (Math.random() - 0.5) * 0.8,
          status: app.status || 'applied',
          salary: app.job?.salary || '',
          match: app.match_score ? Math.round(app.match_score) : 80,
        };
      });
      setPins(mapped.length > 0 ? mapped : []);
      if (mapped.length === 0) useDemoData();
    } catch { useDemoData(); }
    setLoading(false);
  }

  // Init Leaflet map
  useEffect(() => {
    if (!mapRef.current || loading) return;
    let cancelled = false;
    loadLeaflet().then(L => {
      if (cancelled || mapInstanceRef.current) return;

      // Create map
      const map = L.map(mapRef.current, {
        center: [25, 10],
        zoom: 2,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark/light tile layer (CartoDB Positron - clean and professional)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      L.control.attribution({ prefix: false }).addTo(map);
      mapInstanceRef.current = map;
    });
    return () => { cancelled = true; };
  }, [loading]);

  // Add markers when pins change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const displayPins = pins.length > 0 ? pins : [];

    displayPins.forEach(p => {
      const color = SC[p.status] || SC.applied;
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer;transition:transform .2s" title="${p.company}"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
      marker.on('click', () => setActive(p.id === active ? null : p.id));

      // Popup
      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:180px">
          <div style="font-weight:800;font-size:13px;color:#1a1a2e;margin-bottom:2px">${p.title}</div>
          <div style="font-size:11px;color:#6247d4;font-weight:700;margin-bottom:6px">${p.company}</div>
          <div style="font-size:11px;color:#666;margin-bottom:4px">${p.city}</div>
          <div style="display:flex;gap:6px;align-items:center">
            <span style="padding:2px 8px;border-radius:50px;font-size:10px;font-weight:800;background:${SBG[p.status]};color:${color}">${(SL[p.status]||'Applied').toUpperCase()}</span>
            ${p.salary ? `<span style="font-size:11px;color:#0f7a4a;font-weight:700">${p.salary}</span>` : ''}
          </div>
        </div>
      `, { maxWidth: 220, className: 'hired-popup' });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have pins
    if (displayPins.length > 0) {
      try {
        const bounds = L.latLngBounds(displayPins.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8 });
      } catch (e) {}
    }
  }, [pins]);

  const ap = active ? pins.find(p => p.id === active) : null;
  const counts = {};
  Object.keys(SC).forEach(k => { counts[k] = pins.filter(p => p.status === k).length; });

  return (
    <div style={{ flex: 1, display: 'grid', overflow: 'hidden', gridTemplateColumns: '294px 1fr' }}>
      {/* Sidebar */}
      <div style={{ borderRight: '1.5px solid var(--faint)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--surface)' }}>
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--faint)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 800, color: 'var(--ink)', letterSpacing: -.4, marginBottom: 4 }}>Job Map</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            {pins.length > 0 ? `${pins.length} applications tracked` : 'Track where you apply globally'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.entries(SC).slice(0, 4).map(([s, c]) => (
              <div key={s} style={{ padding: '10px 12px', borderRadius: 12, background: SBG[s], border: `1px solid ${c}22` }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 900, color: c, lineHeight: 1 }}>{counts[s] || 0}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: c, marginTop: 3, opacity: .85 }}>{SL[s]}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {loading && <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 12, animation: 'pulse 1.5s ease-in-out infinite' }}>Loading…</div>}
          {pins.map(p => (
            <div key={p.id} onClick={() => {
              setActive(p.id === active ? null : p.id);
              if (mapInstanceRef.current) mapInstanceRef.current.flyTo([p.lat, p.lng], 8, { duration: 1.2 });
            }}
              style={{ padding: '13px 14px', borderRadius: 14, marginBottom: 6, cursor: 'pointer', transition: 'all .15s', background: active === p.id ? 'var(--p50)' : 'transparent', border: `1.5px solid ${active === p.id ? 'var(--p300)' : 'transparent'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)', lineHeight: 1.3, flex: 1, paddingRight: 8 }}>{p.title}</div>
                <span style={{ padding: '2px 8px', borderRadius: 50, fontSize: 9, fontWeight: 800, background: SBG[p.status] || SBG.applied, color: SC[p.status] || SC.applied, flexShrink: 0 }}>{(p.status || 'applied').toUpperCase()}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: active === p.id ? 'var(--p600)' : 'var(--p500)', marginBottom: 4 }}>{p.company}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.city}</div>
            </div>
          ))}
          {!loading && pins.length === 0 && (
            <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
              No applications yet.<br />Apply to jobs and they'll appear here.
            </div>
          )}
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--faint)', flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Status Legend</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(SC).map(([s, c]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'var(--ink)' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: c, flexShrink: 0 }} />{SL[s]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', zIndex: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, animation: 'pulse 1.5s ease-in-out infinite' }}>Loading map…</div>
          </div>
        )}
        <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />

        {/* Active card overlay */}
        {ap && (
          <div style={{ position: 'absolute', top: 16, right: 16, width: 268, borderRadius: 22, background: 'var(--surface)', border: '1.5px solid var(--faint)', boxShadow: '0 16px 56px rgba(98,71,212,.2)', overflow: 'hidden', zIndex: 1000 }}>
            <div style={{ height: 5, background: `linear-gradient(90deg,${SC[ap.status] || SC.applied},${SC[ap.status] || SC.applied}88)` }} />
            <div style={{ padding: '18px 20px' }}>
              <button onClick={() => setActive(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'var(--faint2)', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1, width: 26, height: 26, borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--p100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: 'var(--p700)', fontFamily: 'var(--serif)', flexShrink: 0 }}>{(ap.company || '?').slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontWeight: 800, fontSize: 15, color: 'var(--ink)', lineHeight: 1.2 }}>{ap.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--p500)', fontWeight: 600, marginTop: 2 }}>{ap.company}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>{ap.city}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
                {ap.salary && <div><div style={{ fontSize: 15, fontWeight: 900, color: '#0f7a4a', fontFamily: 'var(--serif)' }}>{ap.salary}</div><div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Salary</div></div>}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 900, color: 'var(--p600)', lineHeight: 1 }}>{ap.match}%</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>AI match</div>
                </div>
              </div>
              <span style={{ padding: '5px 13px', borderRadius: 50, fontSize: 10, fontWeight: 800, background: SBG[ap.status] || SBG.applied, color: SC[ap.status] || SC.applied }}>{(SL[ap.status] || 'Applied').toUpperCase()}</span>
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 14, left: 14, fontSize: 10.5, fontWeight: 600, color: 'var(--p600)', background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 50, border: '1px solid rgba(98,71,212,.15)', zIndex: 1000 }}>
          {pins.length > 0 ? `${pins.length} applications on map` : 'Demo data — apply to jobs to see yours'}
        </div>
      </div>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .hired-popup .leaflet-popup-content-wrapper{border-radius:12px;border:1.5px solid rgba(98,71,212,.15);box-shadow:0 8px 32px rgba(98,71,212,.15);}
        .hired-popup .leaflet-popup-tip{background:white;}
        .leaflet-control-zoom{border:1.5px solid var(--faint)!important;border-radius:10px!important;overflow:hidden;}
        .leaflet-control-zoom a{background:var(--surface)!important;color:var(--ink)!important;border-bottom:1px solid var(--faint)!important;}
        .leaflet-control-zoom a:hover{background:var(--p50)!important;}
      `}</style>
    </div>
  );
}
