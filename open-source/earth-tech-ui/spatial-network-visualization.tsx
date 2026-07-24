/**
 * @license
 * VVU EARTH TECH - Earth Tech UI
 * Copyright (c) 2026 Venture Vision Ubuntu
 *
 * LICENSE: Apache-2.0 (Open Source) OR Commercial (Enterprise)
 * See LICENSE and COMMERCIAL_LICENSE.md for details.
 *
 * This file is part of the VVU EARTH TECH horizontal infrastructure.
 * It contains no product-specific logic (Golden Rule).
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// §1 — Types & Mock Data
// ============================================================================

export interface DeploymentZone {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'deployed' | 'monitoring' | 'maintenance';
  confidenceScore: number;
  center: { lat: number; lng: number };
  zoneType: 'polyline' | 'polygon' | 'marker' | 'circle' | 'heatmap';
  description: string;
  /** For polyline/polygon — array of coordinates */
  coordinates?: Array<{ lat: number; lng: number }>;
  /** For circle — radius in meters */
  radius?: number;
  /** For heatmap — weight array per coordinate */
  weights?: number[];
  /** Color for the overlay */
  color: string;
}

/** 5 NMBM (Nelson Mandela Bay Municipality) deployment scenarios */
export const NMBM_SCENARIOS: DeploymentZone[] = [
  {
    id: 'nmbm-zone-1',
    name: 'Coega Industrial Zone',
    status: 'active',
    confidenceScore: 0.94,
    center: { lat: -33.7857, lng: 25.6345 },
    zoneType: 'polygon',
    description: 'Deep-water port industrial corridor — seismic monitoring deployment',
    coordinates: [
      { lat: -33.78, lng: 25.62 },
      { lat: -33.79, lng: 25.65 },
      { lat: -33.81, lng: 25.64 },
      { lat: -33.80, lng: 25.60 },
      { lat: -33.78, lng: 25.62 },
    ],
    color: '#10b981',
  },
  {
    id: 'nmbm-zone-2',
    name: 'Motherwell Pipeline Route',
    status: 'monitoring',
    confidenceScore: 0.87,
    center: { lat: -33.855, lng: 25.575 },
    zoneType: 'polyline',
    description: 'Water pipeline monitoring route — pressure sensor deployment',
    coordinates: [
      { lat: -33.82, lng: 25.54 },
      { lat: -33.85, lng: 25.56 },
      { lat: -33.87, lng: 25.58 },
      { lat: -33.90, lng: 25.60 },
      { lat: -33.92, lng: 25.62 },
    ],
    color: '#f59e0b',
  },
  {
    id: 'nmbm-zone-3',
    name: 'Port Elizabeth CBD Sensor Hub',
    status: 'deployed',
    confidenceScore: 0.91,
    center: { lat: -33.9608, lng: 25.6291 },
    zoneType: 'marker',
    description: 'Central business district — multi-sensor convergence point',
    color: '#ef4444',
  },
  {
    id: 'nmbm-zone-4',
    name: 'Swartkops Estuary Buffer',
    status: 'pending',
    confidenceScore: 0.76,
    center: { lat: -33.875, lng: 25.585 },
    zoneType: 'circle',
    description: 'Environmental monitoring buffer zone — flood risk assessment',
    radius: 2000,
    color: '#8b5cf6',
  },
  {
    id: 'nmbm-zone-5',
    name: 'Uitenhage Manufacturing Belt',
    status: 'active',
    confidenceScore: 0.82,
    center: { lat: -33.763, lng: 25.395 },
    zoneType: 'heatmap',
    description: 'Manufacturing district — noise/vibration intensity heatmap',
    coordinates: [
      { lat: -33.758, lng: 25.39 },
      { lat: -33.762, lng: 25.395 },
      { lat: -33.768, lng: 25.40 },
      { lat: -33.76, lng: 25.385 },
      { lat: -33.765, lng: 25.392 },
      { lat: -33.755, lng: 25.388 },
    ],
    weights: [0.8, 0.9, 0.7, 0.6, 0.85, 0.5],
    color: '#06b6d4',
  },
];

// ============================================================================
// §2 — Google Maps Loader (script tag, NO @react-google-maps/api)
// ============================================================================

const GOOGLE_MAPS_API_KEY = ''; // Set via environment or prop
const MAP_ID = 'nmbm_deployment_map';

let mapsLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Cannot load Google Maps outside browser'));
      return;
    }

    // Check if already loaded
    if (window.google?.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization&map_ids=${MAP_ID}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

// ============================================================================
// §3 — SpatialNetworkVisualization Component
// ============================================================================

export interface SpatialNetworkVisualizationProps {
  /** Google Maps API key (required for rendering) */
  apiKey?: string;
  /** Deployment zones to render (defaults to NMBM scenarios) */
  zones?: DeploymentZone[];
  /** Initial map center */
  center?: { lat: number; lng: number };
  /** Initial zoom level */
  zoom?: number;
  /** Map height */
  height?: string;
  /** Callback when a zone is clicked */
  onZoneClick?: (zone: DeploymentZone) => void;
}

export function SpatialNetworkVisualization({
  apiKey = GOOGLE_MAPS_API_KEY,
  zones = NMBM_SCENARIOS,
  center = { lat: -33.86, lng: 25.58 },
  zoom = 11,
  height = '500px',
  onZoneClick,
}: SpatialNetworkVisualizationProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<google.maps.MapsEventListener[]>([]);
  const [mapReady, setMapReady] = useState(false);
  // Compute error state from props (not in effect)
  const apiKeyError = !apiKey
    ? 'Google Maps API key is required. Pass apiKey prop or set environment variable.'
    : null;
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<DeploymentZone | null>(null);

  // Combined error: API key error (computed from props) or load error (from async)
  const error = apiKeyError || loadError;

  // Initialize map
  useEffect(() => {
    if (apiKeyError) return;

    let cancelled = false;

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current) return;

        const map = new window.google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapId: MAP_ID,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        googleMapRef.current = map;
        if (!cancelled) setMapReady(true);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setLoadError(err.message || 'Failed to load Google Maps');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiKeyError, apiKey, center, zoom]);

  // Render overlays when map is ready
  useEffect(() => {
    if (!mapReady || !googleMapRef.current) return;

    const map = googleMapRef.current;

    // Clear previous overlays
    overlaysRef.current.forEach((listener) => listener.remove());
    overlaysRef.current = [];

    // Track native overlay objects for cleanup
    const overlayObjects: google.maps.MVCObject[] = [];

    zones.forEach((zone) => {
      switch (zone.zoneType) {
        // ── Polygon ──
        case 'polygon': {
          if (!zone.coordinates) return;
          const polygon = new window.google.maps.Polygon({
            paths: zone.coordinates.map((c) => ({ lat: c.lat, lng: c.lng })),
            strokeColor: zone.color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: zone.color,
            fillOpacity: 0.35,
            map,
          });
          overlayObjects.push(polygon);
          const listener = polygon.addListener('click', () => {
            setSelectedZone(zone);
            onZoneClick?.(zone);
          });
          overlaysRef.current.push(listener);
          break;
        }

        // ── Polyline ──
        case 'polyline': {
          if (!zone.coordinates) return;
          const polyline = new window.google.maps.Polyline({
            path: zone.coordinates.map((c) => ({ lat: c.lat, lng: c.lng })),
            strokeColor: zone.color,
            strokeOpacity: 0.9,
            strokeWeight: 3,
            map,
          });
          overlayObjects.push(polyline);
          const listener = polyline.addListener('click', () => {
            setSelectedZone(zone);
            onZoneClick?.(zone);
          });
          overlaysRef.current.push(listener);
          break;
        }

        // ── Marker ──
        case 'marker': {
          const marker = new window.google.maps.Marker({
            position: { lat: zone.center.lat, lng: zone.center.lng },
            title: zone.name,
            map,
          });
          overlayObjects.push(marker);
          const listener = marker.addListener('click', () => {
            setSelectedZone(zone);
            onZoneClick?.(zone);
          });
          overlaysRef.current.push(listener);
          break;
        }

        // ── Circle ──
        case 'circle': {
          const circle = new window.google.maps.Circle({
            center: { lat: zone.center.lat, lng: zone.center.lng },
            radius: zone.radius || 1000,
            strokeColor: zone.color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: zone.color,
            fillOpacity: 0.25,
            map,
          });
          overlayObjects.push(circle);
          const listener = circle.addListener('click', () => {
            setSelectedZone(zone);
            onZoneClick?.(zone);
          });
          overlaysRef.current.push(listener);
          break;
        }

        // ── HeatmapLayer ──
        case 'heatmap': {
          if (!zone.coordinates || !zone.weights) return;
          try {
            const heatmapData = zone.coordinates.map((c, i) => ({
              location: new window.google.maps.LatLng(c.lat, c.lng),
              weight: zone.weights![i],
            }));
            const heatmap = new window.google.maps.visualization.HeatmapLayer({
              data: heatmapData,
              radius: 50,
              map,
            });
            overlayObjects.push(heatmap);
          } catch (e) {
            // HeatmapLayer requires the visualization library
            console.warn('HeatmapLayer unavailable — visualization library not loaded:', e);
          }
          break;
        }
      }
    });

    // Cleanup overlays on re-render
    return () => {
      overlayObjects.forEach((obj) => {
        if ('setMap' in obj) {
          (obj as google.maps.MVCObject & { setMap: (m: null) => void }).setMap(null);
        }
      });
    };
  }, [mapReady, zones, onZoneClick]);

  // Status badge color mapping
  const statusColor: Record<string, string> = {
    active: 'bg-emerald-500',
    pending: 'bg-yellow-500',
    deployed: 'bg-red-500',
    monitoring: 'bg-orange-500',
    maintenance: 'bg-gray-500',
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Map container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height,
          borderRadius: '8px',
          border: error ? '2px solid #ef4444' : '1px solid #e5e7eb',
          background: error ? '#fef2f2' : '#f3f4f6',
        }}
      >
        {!mapReady && !error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280',
              fontSize: '14px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
              <div>Loading NMBM Spatial Network...</div>
            </div>
          </div>
        )}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#dc2626',
              fontSize: '14px',
            }}
          >
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>⚠️</div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Map Error</div>
              <div>{error}</div>
            </div>
          </div>
        )}
      </div>

      {/* Zone metadata panel */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '12px',
          padding: '12px',
          background: '#1f2937',
          borderRadius: '8px',
        }}
      >
        {zones.map((zone) => (
          <div
            key={zone.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '8px 12px',
              borderRadius: '6px',
              background: selectedZone?.id === zone.id ? '#374151' : '#111827',
              border: selectedZone?.id === zone.id ? `2px solid ${zone.color}` : '1px solid #4b5563',
              cursor: 'pointer',
              minWidth: '160px',
              transition: 'background 0.2s',
            }}
            onClick={() => {
              setSelectedZone(zone);
              onZoneClick?.(zone);
              // Pan map to zone center
              if (googleMapRef.current) {
                googleMapRef.current.panTo({ lat: zone.center.lat, lng: zone.center.lng });
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: zone.color,
                }}
              />
              <span style={{ color: '#f9fafb', fontSize: '13px', fontWeight: 600 }}>{zone.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#fff',
                  background: zone.color,
                  opacity: 0.8,
                }}
              >
                {zone.zoneType}
              </span>
              <span
                style={{
                  display: 'inline-block',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#fff',
                }}
                className={statusColor[zone.status]}
              >
                {zone.status}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                conf: {zone.confidenceScore.toFixed(2)}
              </span>
            </div>
            {selectedZone?.id === zone.id && (
              <div style={{ color: '#d1d5db', fontSize: '12px', marginTop: '4px' }}>
                {zone.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SpatialNetworkVisualization;
