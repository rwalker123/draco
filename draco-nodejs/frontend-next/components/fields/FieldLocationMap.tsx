'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';

export interface FieldLocationMapProps {
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

function MapSizeRefresher({ trigger }: { trigger: unknown }) {
  const map = useMap();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => cancelAnimationFrame(frame);
  }, [map, trigger]);

  return null;
}

function MapFullscreenControl() {
  const map = useMap();

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    interface VendorHTMLElement extends HTMLElement {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    }

    interface VendorDocument extends Document {
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
      webkitFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
      msFullscreenElement?: Element | null;
    }

    const container = map.getContainer() as VendorHTMLElement;
    const vendorDocument = document as VendorDocument;

    const requestFullscreen =
      container.requestFullscreen?.bind(container) ??
      container.webkitRequestFullscreen?.bind(container) ??
      container.mozRequestFullScreen?.bind(container) ??
      container.msRequestFullscreen?.bind(container);

    const exitFullscreen =
      vendorDocument.exitFullscreen?.bind(vendorDocument) ??
      vendorDocument.webkitExitFullscreen?.bind(vendorDocument) ??
      vendorDocument.mozCancelFullScreen?.bind(vendorDocument) ??
      vendorDocument.msExitFullscreen?.bind(vendorDocument);

    if (!requestFullscreen || !exitFullscreen) {
      return;
    }

    let button: HTMLButtonElement | null = null;

    const isContainerFullscreen = () => {
      const element =
        document.fullscreenElement ??
        vendorDocument.webkitFullscreenElement ??
        vendorDocument.mozFullScreenElement ??
        vendorDocument.msFullscreenElement ??
        null;
      return element === container;
    };

    const updateButtonState = () => {
      if (!button) {
        return;
      }
      const active = isContainerFullscreen();
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.setAttribute('title', active ? 'Exit fullscreen map' : 'View fullscreen map');
      button.setAttribute('aria-label', active ? 'Exit fullscreen map' : 'View fullscreen map');
      button.innerHTML = active
        ? '<span aria-hidden="true">&times;</span>'
        : '<span aria-hidden="true">&#x26F6;</span>';
      const timeout = window.setTimeout(() => {
        const container = map.getContainer();
        if (!container || !container.isConnected) {
          return;
        }
        try {
          map.invalidateSize();
        } catch {
          // ignore resize errors that can occur if the map is unmounted
        }
      }, 220);
      return () => window.clearTimeout(timeout);
    };

    const handleToggle = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (isContainerFullscreen()) {
        exitFullscreen.call(document);
      } else {
        requestFullscreen.call(container);
      }
    };

    const handleFullscreenChange: EventListener = () => {
      updateButtonState();
    };

    const control = new L.Control({ position: 'topright' }) as L.Control;

    control.onAdd = () => {
      const wrapper = L.DomUtil.create('div', 'leaflet-bar leaflet-control') as HTMLDivElement;
      button = L.DomUtil.create(
        'button',
        'leaflet-control-fullscreen-toggle leaflet-bar-part leaflet-bar-part-single',
        wrapper,
      ) as HTMLButtonElement;
      button.type = 'button';
      button.setAttribute('aria-label', 'View fullscreen map');
      button.innerHTML = '<span aria-hidden="true">&#x26F6;</span>';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.width = '34px';
      button.style.height = '34px';
      button.style.fontSize = '18px';
      button.style.backgroundColor = '#ffffff';
      button.style.color = '#1976d2';
      button.style.border = '1px solid rgba(25, 118, 210, 0.4)';
      button.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.2)';
      button.style.cursor = 'pointer';
      button.style.borderRadius = '4px';
      button.style.padding = '0';
      button.style.lineHeight = '1';
      button.addEventListener('click', handleToggle);
      L.DomEvent.disableClickPropagation(wrapper);
      L.DomEvent.disableScrollPropagation(wrapper);
      updateButtonState();
      return wrapper;
    };

    control.onRemove = () => {
      if (button) {
        button.removeEventListener('click', handleToggle);
      }
      button = null;
    };

    control.addTo(map);

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    if ('webkitFullscreenElement' in vendorDocument) {
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    }
    if ('mozFullScreenElement' in vendorDocument) {
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    }
    if ('msFullscreenElement' in vendorDocument) {
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    }

    return () => {
      control.remove();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if ('webkitFullscreenElement' in vendorDocument) {
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      }
      if ('mozFullScreenElement' in vendorDocument) {
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      }
      if ('msFullscreenElement' in vendorDocument) {
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      }
    };
  }, [map]);

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

  const sizeTrigger = hasLocation
    ? `${latitude as number}-${longitude as number}-${zoom}`
    : `default-${zoom}`;

  return (
    <MapContainer
      key={sizeTrigger}
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: 12 }}
      scrollWheelZoom={!readOnly}
      dragging={!readOnly}
      doubleClickZoom={!readOnly}
      attributionControl={true}
    >
      <MapFullscreenControl />
      <MapSizeRefresher trigger={sizeTrigger} />
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
