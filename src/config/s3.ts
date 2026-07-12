import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "./logger";

const S3_ENDPOINT = process.env.S3_ENDPOINT || "localhost";
const S3_PORT = process.env.S3_PORT || "9000";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "minio_admin";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "minio_admin_secret";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "transitops-documents";
const S3_USE_SSL = process.env.S3_USE_SSL === "true";

export const s3Client = new S3Client({
  endpoint: `http${S3_USE_SSL ? "s" : ""}://${S3_ENDPOINT}:${S3_PORT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // required for MinIO
});

export const uploadFile = async (key: string, body: Buffer, contentType: string): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await s3Client.send(command);
    
    // Return direct URL since it's local MinIO/S3
    return `http${S3_USE_SSL ? "s" : ""}://${S3_ENDPOINT}:${S3_PORT}/${S3_BUCKET_NAME}/${key}`;
  } catch (error) {
    logger.error(`Failed to upload file to S3 (${key}):`, error);
    throw error;
  }
};
