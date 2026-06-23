import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://localhost:8333", 
  region: "us-east-1", 
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "admin",
    secretAccessKey: process.env.S3_SECRET_KEY || "secret",
  },
  forcePathStyle: true, 
});