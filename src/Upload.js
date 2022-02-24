import AWS from "aws-sdk";

const AWS_REGION = "us-east-1";

const AWS_ACL = "public-read";

const AWS_CONTENT_ENCODING = "base64";

const AWS_STORAGE_CLASS = "REDUCED_REDUNDANCY";

export const getUploader = ({ accessKeyId, secretAccessKey }) => {
  const screenshotUploader = new AWS.S3({
    accessKeyId,
    secretAccessKey,
    region: AWS_REGION,
    maxRetries: 5,
  });

  return screenshotUploader;
};

export const upload = (uploader, { bucket, filename, body, imageFormat }) => {
  return new Promise((resolve, reject) => {
    uploader.upload(
      {
        Bucket: bucket,
        Key: filename,
        Body: body,
        ACL: AWS_ACL,
        ContentEncoding: AWS_CONTENT_ENCODING,
        ContentType: `image/${imageFormat}`,
        StorageClass: AWS_STORAGE_CLASS,
      },
      (error, data) => {
        if (error) {
          return reject(error);
        }
        resolve(data);
      }
    );
  });
};
