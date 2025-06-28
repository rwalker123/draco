import * as fs from "fs";
import * as path from "path";
import * as sharp from "sharp";

export interface StorageService {
  saveLogo(
    accountId: string,
    teamId: string,
    imageBuffer: Buffer,
  ): Promise<string>;
  getLogo(accountId: string, teamId: string): Promise<Buffer | null>;
  deleteLogo(accountId: string, teamId: string): Promise<boolean>;
}

export class LocalStorageService implements StorageService {
  private basePath: string;

  constructor(basePath: string = "uploads") {
    this.basePath = basePath;
  }

  private getLogoPath(accountId: string, teamId: string): string {
    return path.join(
      this.basePath,
      accountId,
      "team-logos",
      `${teamId}-logo.png`,
    );
  }

  private ensureDirectoryExists(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async saveLogo(
    accountId: string,
    teamId: string,
    imageBuffer: Buffer,
  ): Promise<string> {
    const logoPath = this.getLogoPath(accountId, teamId);
    this.ensureDirectoryExists(logoPath);

    // Resize and save the image
    await sharp(imageBuffer)
      .resize(60, 60, {
        fit: "cover",
        position: "center",
      })
      .png({ quality: 85 })
      .toFile(logoPath);

    return logoPath;
  }

  async getLogo(accountId: string, teamId: string): Promise<Buffer | null> {
    const logoPath = this.getLogoPath(accountId, teamId);

    try {
      if (fs.existsSync(logoPath)) {
        return fs.readFileSync(logoPath);
      }
      return null;
    } catch (error) {
      console.error("Error reading logo file:", error);
      return null;
    }
  }

  async deleteLogo(accountId: string, teamId: string): Promise<boolean> {
    const logoPath = this.getLogoPath(accountId, teamId);

    try {
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting logo file:", error);
      return false;
    }
  }
}

export class S3StorageService implements StorageService {
  // TODO: Implement S3 storage service for production
  // This would use AWS SDK to upload/download files from S3

  async saveLogo(
    accountId: string,
    teamId: string,
    imageBuffer: Buffer,
  ): Promise<string> {
    // TODO: Implement S3 upload
    throw new Error("S3 storage not implemented yet");
  }

  async getLogo(accountId: string, teamId: string): Promise<Buffer | null> {
    // TODO: Implement S3 download
    throw new Error("S3 storage not implemented yet");
  }

  async deleteLogo(accountId: string, teamId: string): Promise<boolean> {
    // TODO: Implement S3 delete
    throw new Error("S3 storage not implemented yet");
  }
}

// Factory function to create the appropriate storage service
export function createStorageService(): StorageService {
  const storageType = process.env.STORAGE_TYPE || "local";

  switch (storageType.toLowerCase()) {
    case "s3":
      return new S3StorageService();
    case "local":
    default:
      return new LocalStorageService();
  }
}
