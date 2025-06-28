import * as fs from "fs";
import * as path from "path";
import * as sharp from "sharp";
import * as AWS from "aws-sdk";

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
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET || "draco-team-logos";
    
    // Configure S3 client for LocalStack
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT || "http://localhost:4566",
      region: process.env.S3_REGION || "us-east-1",
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "test",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "test",
      s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    });

    // Enable debug logging if S3_DEBUG is set
    if (process.env.S3_DEBUG === "true") {
      AWS.config.logger = console;
    }
  }

  private getS3Key(accountId: string, teamId: string): string {
    return `${accountId}/team-logos/${teamId}-logo.png`;
  }

  async saveLogo(
    accountId: string,
    teamId: string,
    imageBuffer: Buffer,
  ): Promise<string> {
    const s3Key = this.getS3Key(accountId, teamId);

    // Resize the image using sharp
    const resizedBuffer = await sharp(imageBuffer)
      .resize(60, 60, {
        fit: "cover",
        position: "center",
      })
      .png({ quality: 85 })
      .toBuffer();

    // Upload to S3
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: s3Key,
      Body: resizedBuffer,
      ContentType: "image/png",
      ACL: "public-read",
    };

    try {
      await this.s3.putObject(uploadParams).promise();
      console.log(`Logo uploaded to S3: s3://${this.bucketName}/${s3Key}`);
      return s3Key;
    } catch (error) {
      console.error("Error uploading logo to S3:", error);
      throw new Error(`Failed to upload logo to S3: ${error}`);
    }
  }

  async getLogo(accountId: string, teamId: string): Promise<Buffer | null> {
    const s3Key = this.getS3Key(accountId, teamId);

    try {
      const getParams: AWS.S3.GetObjectRequest = {
        Bucket: this.bucketName,
        Key: s3Key,
      };

      const result = await this.s3.getObject(getParams).promise();
      return result.Body as Buffer;
    } catch (error) {
      if ((error as any).code === "NoSuchKey") {
        console.log(`Logo not found in S3: s3://${this.bucketName}/${s3Key}`);
        return null;
      }
      console.error("Error downloading logo from S3:", error);
      return null;
    }
  }

  async deleteLogo(accountId: string, teamId: string): Promise<boolean> {
    const s3Key = this.getS3Key(accountId, teamId);

    try {
      const deleteParams: AWS.S3.DeleteObjectRequest = {
        Bucket: this.bucketName,
        Key: s3Key,
      };

      await this.s3.deleteObject(deleteParams).promise();
      console.log(`Logo deleted from S3: s3://${this.bucketName}/${s3Key}`);
      return true;
    } catch (error) {
      console.error("Error deleting logo from S3:", error);
      return false;
    }
  }
}

// Factory function to create the appropriate storage service
export function createStorageService(): StorageService {
  const storageProvider = process.env.STORAGE_PROVIDER || "local";

  console.log(`Creating storage service with provider: ${storageProvider}`);

  switch (storageProvider.toLowerCase()) {
    case "s3":
      return new S3StorageService();
    case "local":
    default:
      return new LocalStorageService();
  }
}
