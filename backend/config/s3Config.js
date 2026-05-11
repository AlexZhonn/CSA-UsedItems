import AWS from "aws-sdk";
export const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
export const deleteFileFromS3 = async (fileUrl) => {
  const fileName = fileUrl.split("/").slice(-1)[0];
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `posts/${fileName}`,
  };
  return s3.deleteObject(params).promise();
};
