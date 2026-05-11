import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

export const uploadToS3 = async (file) => {
  const fileExtension = file.originalname.split(".").pop();
  const fileName = `${uuidv4()}.${fileExtension}`;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `posts/${fileName}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const upload = new Upload({
      client: s3,
      params,
    });
    await upload.done();
    console.log("yes!");
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/posts/${fileName}`;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("Failed to upload image to S3");
  }
};

export const deleteFromS3 = async (fileUrl) => {
  const fileName = fileUrl.split("/").pop();

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `posts/${fileName}`,
  };

  try {
    await s3.send(new DeleteObjectCommand(params));
    console.log("Deleted from S3:", params.Key);
    return true;
  } catch (error) {
    console.error("S3 Delete Error:", error);
    throw new Error("Failed to delete image from S3");
  }
};
