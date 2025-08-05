import * as sharp from 'sharp';

export interface ImageConfig {
  width: number;
  height: number;
  fit?: keyof sharp.FitEnum;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
}

export interface ImageDimensions {
  teamLogo: ImageConfig;
  accountLogo: ImageConfig;
  contactPhoto: ImageConfig;
}

export class ImageProcessor {
  private static readonly IMAGE_DIMENSIONS: ImageDimensions = {
    teamLogo: {
      width: 60,
      height: 60,
      fit: 'cover',
      quality: 90,
      format: 'png',
    },
    accountLogo: {
      width: 512,
      height: 125,
      fit: 'cover',
      quality: 90,
      format: 'png',
    },
    contactPhoto: {
      width: 150,
      height: 150,
      fit: 'cover',
      quality: 85,
      format: 'png',
    },
  };

  static async processImage(buffer: Buffer, config: ImageConfig): Promise<Buffer> {
    let sharpInstance = sharp(buffer).resize(config.width, config.height, {
      fit: config.fit || 'cover',
    });

    switch (config.format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality: config.quality || 85 });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality: config.quality || 85 });
        break;
      case 'png':
      default:
        sharpInstance = sharpInstance.png({ quality: config.quality || 90 });
        break;
    }

    return sharpInstance.toBuffer();
  }

  static async processTeamLogo(buffer: Buffer): Promise<Buffer> {
    return this.processImage(buffer, this.IMAGE_DIMENSIONS.teamLogo);
  }

  static async processAccountLogo(buffer: Buffer): Promise<Buffer> {
    return this.processImage(buffer, this.IMAGE_DIMENSIONS.accountLogo);
  }

  static async processContactPhoto(buffer: Buffer): Promise<Buffer> {
    return this.processImage(buffer, this.IMAGE_DIMENSIONS.contactPhoto);
  }

  static getImageDimensions(): ImageDimensions {
    return { ...this.IMAGE_DIMENSIONS };
  }

  static validateImageBuffer(buffer: Buffer, maxSizeInBytes: number = 5 * 1024 * 1024): void {
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid image buffer: Buffer is empty');
    }

    if (buffer.length > maxSizeInBytes) {
      throw new Error(
        `Image size exceeds maximum allowed size of ${maxSizeInBytes / (1024 * 1024)}MB`,
      );
    }
  }

  static async getImageMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    try {
      return await sharp(buffer).metadata();
    } catch (error) {
      throw new Error('Failed to read image metadata: Invalid image format');
    }
  }

  static async validateImageFormat(
    buffer: Buffer,
    allowedFormats: string[] = ['jpeg', 'jpg', 'png', 'webp'],
  ): Promise<void> {
    const metadata = await this.getImageMetadata(buffer);

    if (!metadata.format || !allowedFormats.includes(metadata.format)) {
      throw new Error(`Invalid image format. Allowed formats: ${allowedFormats.join(', ')}`);
    }
  }
}
