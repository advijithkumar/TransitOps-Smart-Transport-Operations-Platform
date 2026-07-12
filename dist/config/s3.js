"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const logger_1 = require("./logger");
const S3_ENDPOINT = process.env.S3_ENDPOINT || "localhost";
const S3_PORT = process.env.S3_PORT || "9000";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "minio_admin";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "minio_admin_secret";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "transitops-documents";
const S3_USE_SSL = process.env.S3_USE_SSL === "true";
exports.s3Client = new client_s3_1.S3Client({
    endpoint: `http${S3_USE_SSL ? "s" : ""}://${S3_ENDPOINT}:${S3_PORT}`,
    region: "us-east-1",
    credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
    },
    forcePathStyle: true, // required for MinIO
});
const uploadFile = async (key, body, contentType) => {
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
        });
        await exports.s3Client.send(command);
        // Return direct URL since it's local MinIO/S3
        return `http${S3_USE_SSL ? "s" : ""}://${S3_ENDPOINT}:${S3_PORT}/${S3_BUCKET_NAME}/${key}`;
    }
    catch (error) {
        logger_1.logger.error(`Failed to upload file to S3 (${key}):`, error);
        throw error;
    }
};
exports.uploadFile = uploadFile;
