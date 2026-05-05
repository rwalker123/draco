export interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropOutputOptions {
  width: number;
  height: number;
  mimeType?: string;
  quality?: number;
}

const DEFAULT_MIME_TYPE = 'image/jpeg';
const DEFAULT_QUALITY = 0.92;

const SUPPORTED_OUTPUT_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image for cropping'));
    image.src = src;
  });

export async function cropImageToBlob(
  source: File | Blob,
  croppedAreaPixels: CroppedAreaPixels,
  output: CropOutputOptions,
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(source);

  try {
    const image = await loadImage(objectUrl);

    const canvas = document.createElement('canvas');
    canvas.width = output.width;
    canvas.height = output.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to obtain 2D canvas context for cropping');
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    context.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      output.width,
      output.height,
    );

    const requestedMimeType = output.mimeType ?? DEFAULT_MIME_TYPE;
    const mimeType = SUPPORTED_OUTPUT_MIME_TYPES.has(requestedMimeType)
      ? requestedMimeType
      : DEFAULT_MIME_TYPE;
    const quality = output.quality ?? DEFAULT_QUALITY;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), mimeType, quality);
    });

    if (!blob) {
      throw new Error('Canvas returned an empty blob while cropping image');
    }

    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function buildCroppedFile(
  source: File,
  blob: Blob,
  outputMimeType: string = DEFAULT_MIME_TYPE,
): File {
  const targetMime = SUPPORTED_OUTPUT_MIME_TYPES.has(outputMimeType)
    ? outputMimeType
    : DEFAULT_MIME_TYPE;
  const extension = MIME_TYPE_TO_EXTENSION[targetMime] ?? 'jpg';
  const baseName = source.name.replace(/\.[^./\\]+$/, '') || 'image';
  return new File([blob], `${baseName}.${extension}`, {
    type: targetMime,
    lastModified: Date.now(),
  });
}
