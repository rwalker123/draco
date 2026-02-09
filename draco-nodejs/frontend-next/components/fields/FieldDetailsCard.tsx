'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import Button from '@mui/material/Button';
import DirectionsIcon from '@mui/icons-material/Directions';
import type { FieldLocationMapProps } from './FieldLocationMap';

export interface FieldDetails {
  id?: string | null;
  name?: string | null;
  shortName?: string | null;
  hasLights?: boolean | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  zipCode?: string | null;
  rainoutNumber?: string | null;
  comment?: string | null;
  directions?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
}

export interface FieldDetailsCardProps {
  field: FieldDetails | null | undefined;
  placeholderTitle?: string;
  placeholderDescription?: string;
  mapHeight?: number;
}

const FieldLocationMap = dynamic<FieldLocationMapProps>(
  () => import('./FieldLocationMap').then((module) => module.FieldLocationMap),
  {
    ssr: false,
    loading: () => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 320,
        }}
      >
        <CircularProgress size={32} />
      </Box>
    ),
  },
);

const parseCoordinate = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const numeric = Number.parseFloat(trimmed);
  return Number.isNaN(numeric) ? null : numeric;
};

export const FieldDetailsCard: React.FC<FieldDetailsCardProps> = ({
  field,
  placeholderTitle = 'Select a field',
  placeholderDescription = 'Choose a field to view its location and details.',
  mapHeight = 320,
}) => {
  const stopClickPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const latitude = parseCoordinate(field?.latitude ?? null);
  const longitude = parseCoordinate(field?.longitude ?? null);
  const zip = field?.zip?.trim().length
    ? field?.zip
    : field?.zipCode?.trim().length
      ? field?.zipCode
      : null;
  const directionsUrl = (() => {
    if (!field) {
      return null;
    }

    if (latitude !== null && longitude !== null) {
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }

    const addressParts = [field.address, field.city, field.state, zip]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value.length > 0);

    if (addressParts.length === 0) {
      return null;
    }

    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressParts.join(', '))}`;
  })();

  return (
    <Card
      elevation={3}
      onClick={stopClickPropagation}
      onMouseDown={stopClickPropagation}
      onTouchStart={stopClickPropagation}
      onPointerDown={stopClickPropagation}
    >
      <CardHeader
        title={field?.name ?? placeholderTitle}
        subheader={field?.address ?? placeholderDescription}
        titleTypographyProps={{ color: 'text.primary', fontWeight: 600 }}
        subheaderTypographyProps={{ color: 'text.secondary' }}
      />
      <CardContent>
        {field ? (
          <Stack spacing={2}>
            <Box
              onClick={(event) => {
                event.stopPropagation();
              }}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              onTouchStart={(event) => {
                event.stopPropagation();
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              sx={{ borderRadius: 2, overflow: 'hidden' }}
            >
              <FieldLocationMap
                latitude={latitude}
                longitude={longitude}
                readOnly
                height={mapHeight}
              />
            </Box>
            {directionsUrl ? (
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<DirectionsIcon />}
                  fullWidth
                  onClick={(event) => {
                    event.stopPropagation();
                    window.open(directionsUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  Open Directions
                </Button>
              </Box>
            ) : null}
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Location Details
              </Typography>
              <Typography variant="body2">
                {field.address ? field.address : 'Address not provided'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {[field.city, field.state, zip]
                  .filter((value) => typeof value === 'string' && value.trim().length > 0)
                  .join(', ') || 'City/state not provided'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {field.hasLights ? 'Has lights' : 'No lights'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Rainout Line
              </Typography>
              <Typography variant="body2">
                {field.rainoutNumber ? field.rainoutNumber : 'No rainout number on file.'}
              </Typography>
            </Box>
            {field.comment ? (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Comments
                </Typography>
                <Typography variant="body2">{field.comment}</Typography>
              </Box>
            ) : null}
            {field.directions ? (
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Directions
                </Typography>
                <Typography variant="body2">{field.directions}</Typography>
              </Box>
            ) : null}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Select a field to view its map and details.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default FieldDetailsCard;
