import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
});

const BUCKET = process.env.S3_BUCKET!;

export const GLB_MAX_BYTES = 50 * 1024 * 1024;  // 50 MB hard cap
export const GLB_WARN_BYTES = 15 * 1024 * 1024; // 15 MB recommendation

export function modelS3Key(storeId: string, modelId: string): string {
  return `stores/${storeId}/models/${modelId}.glb`;
}

/** Returns a presigned PUT URL the admin frontend uploads directly to S3 */
export async function presignUpload(key: string, contentType = 'model/gltf-binary'): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLengthRange: { min: 1, max: GLB_MAX_BYTES } as never,
  });
  return getSignedUrl(s3, cmd, { expiresIn: 3600 });
}

/** Returns a presigned GET URL for the viewer to stream the GLB (1-hour TTL) */
export async function presignDownload(key: string, expiresIn = 3600): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
