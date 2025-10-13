'use client';

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';

interface FieldLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange?: (latitude: number, longitude: number) => void;
  height?: number;
  readOnly?: boolean;
}

const DEFAULT_CENTER: LatLngExpression = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;
const LOCATION_ZOOM = 13;

function MapViewUpdater({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap();

  React.useEffect(() => {
    map.setView(center, zoom, { animate: false });
  }, [center, zoom, map]);

  return null;
}

function MapClickHandler({
  onLocationChange,
  disabled,
}: {
  onLocationChange?: (latitude: number, longitude: number) => void;
  disabled: boolean;
}) {
  useMapEvents({
    click: (event) => {
      if (!disabled) {
        onLocationChange?.(event.latlng.lat, event.latlng.lng);
      }
    },
  });

  return null;
}

export const FieldLocationMap: React.FC<FieldLocationMapProps> = ({
  latitude,
  longitude,
  onLocationChange,
  height = 320,
  readOnly = false,
}) => {
  const hasLocation = typeof latitude === 'number' && typeof longitude === 'number';

  const center = useMemo<LatLngExpression>(() => {
    if (hasLocation && latitude !== null && longitude !== null) {
      return [latitude, longitude];
    }

    return DEFAULT_CENTER;
  }, [hasLocation, latitude, longitude]);

  const zoom = hasLocation ? LOCATION_ZOOM : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: 12 }}
      scrollWheelZoom={!readOnly}
      dragging={!readOnly}
      doubleClickZoom={!readOnly}
      attributionControl={true}
    >
      <MapViewUpdater center={center} zoom={zoom} />
      <MapClickHandler
        onLocationChange={onLocationChange}
        disabled={readOnly || !onLocationChange}
      />
      <TileLayer
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hasLocation ? (
        <CircleMarker
          center={[latitude as number, longitude as number]}
          radius={10}
          pathOptions={{ color: '#1976d2', fillColor: '#1976d2', fillOpacity: 0.6 }}
        />
      ) : null}
    </MapContainer>
  );
};

export default FieldLocationMap;
