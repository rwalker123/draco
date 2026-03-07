import '../src/config/loadEnv.js';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

const bucket = process.env.R2_BACKUP_BUCKET;
if (!bucket) {
  console.error('R2_BACKUP_BUCKET is not set');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

console.log(`Clearing all objects from bucket: ${bucket}`);

let continuationToken: string | undefined;
let totalDeleted = 0;

do {
  const listResponse = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    }),
  );

  const objects = listResponse.Contents ?? [];

  for (const obj of objects) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key! }));
    console.log(`  Deleted: ${obj.Key}`);
    totalDeleted++;
  }

  continuationToken = listResponse.NextContinuationToken;
} while (continuationToken);

console.log(`Done. Deleted ${totalDeleted} object(s).`);
