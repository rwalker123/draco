export interface ImageCropPreset {
  aspect: number;
  outputWidth: number;
  outputHeight: number;
  outputMimeType: string;
  outputQuality?: number;
  label: string;
}

export const IMAGE_CROP_PRESETS = {
  accountLogo: {
    aspect: 512 / 125,
    outputWidth: 512,
    outputHeight: 125,
    outputMimeType: 'image/png',
    label: 'Account Logo',
  },
  contactPhoto: {
    aspect: 1,
    outputWidth: 80,
    outputHeight: 80,
    outputMimeType: 'image/png',
    label: 'Contact Photo',
  },
  sponsorPhoto: {
    aspect: 170 / 130,
    outputWidth: 170,
    outputHeight: 130,
    outputMimeType: 'image/png',
    label: 'Sponsor Logo',
  },
  teamLogo: {
    aspect: 1,
    outputWidth: 80,
    outputHeight: 80,
    outputMimeType: 'image/png',
    label: 'Team Logo',
  },
  photoSubmission: {
    aspect: 16 / 9,
    outputWidth: 800,
    outputHeight: 450,
    outputMimeType: 'image/jpeg',
    outputQuality: 0.9,
    label: 'Photo',
  },
} as const satisfies Record<string, ImageCropPreset>;

export type ImageCropPresetKey = keyof typeof IMAGE_CROP_PRESETS;
