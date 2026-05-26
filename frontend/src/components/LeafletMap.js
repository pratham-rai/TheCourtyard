'use client';
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LeafletMap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Position coordinate parameters for Mangaluru location
    const coordinates = [12.8856062, 74.8665164];
    
    // Create the leaflet map container with minimal clean controls
    const map = L.map(mapRef.current, {
      center: coordinates,
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    mapInstance.current = map;

    // Load premium dark-theme CartoDB tiles matching our dark luxury branding
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    // Custom CSS/SVG pulsating neon green marker representing The Courtyard
    const neonIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center" style="cursor: pointer;">
          <div class="absolute w-8 h-8 rounded-full bg-[#39ff14]/30 animate-ping"></div>
          <div class="w-6 h-6 rounded-full bg-[#39ff14] border-4 border-[#0e0f14] flex items-center justify-center shadow-lg" style="box-shadow: 0 0 15px #39ff14; transform: scale(1.1); transition: transform 0.3s ease;">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      className: 'custom-neon-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Place the interactive marker pin on the map coordinates
    const marker = L.marker(coordinates, { icon: neonIcon }).addTo(map);

    // Trigger instant Google Maps link redirection upon clicking map elements
    const handleRedirect = () => {
      window.open('https://maps.app.goo.gl/pwoVYiwghnCQ6jkc8', '_blank', 'noopener,noreferrer');
    };

    marker.on('click', handleRedirect);

    map.on('click', (e) => {
      // If clicking general tiles/container, redirect to google maps
      if (e.originalEvent.target.classList.contains('leaflet-container') || 
          e.originalEvent.target.classList.contains('leaflet-tile')) {
        handleRedirect();
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative group" style={{ minHeight: '320px' }}>
      {/* Real Map Canvas Element */}
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl" style={{ minHeight: '320px', background: '#0e0f14' }} />
      
      {/* Glowing Neon Map Tag */}
      <div className="absolute top-4 right-4 z-[1000] px-3.5 py-1.5 bg-black/90 backdrop-blur-md rounded-xl border border-[#39ff14]/30 text-[#39ff14] text-[10px] font-extrabold uppercase tracking-widest pointer-events-none shadow-2xl transition-all duration-300">
        📍 Tap to Open Google Maps
      </div>
    </div>
  );
}
