package main

import (
	"bytes"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

func downloadFileFromS3(bucket, key, localPath string) error {
	file, err := os.Create(localPath)
	if err != nil {
		return fmt.Errorf("failed to create local file %s: %w", localPath, err)
	}
	defer file.Close()

	numBytes, err := s3Downloader.Download(file,
		&s3.GetObjectInput{
			Bucket: aws.String(bucket),
			Key:    aws.String(key),
		})
	if err != nil {
		return fmt.Errorf("failed to download file %s/%s: %w", bucket, key, err)
	}
	log.Printf("Downloaded %d bytes from s3://%s/%s to %s", numBytes, bucket, key, localPath)
	return nil
}

func uploadFileToS3(bucket, key string, content []byte) error {
	_, err := s3Uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   bytes.NewReader(content),
	})
	if err != nil {
		return fmt.Errorf("failed to upload content to s3://%s/%s: %w", bucket, key, err)
	}
	log.Printf("Uploaded results to s3://%s/%s", bucket, key)
	return nil
}

func s3PrefixExists(bucket, prefix string) (bool, error) {
	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(bucket),
		Prefix: aws.String(prefix),
		MaxKeys: aws.Int64(1),
	}
	out, err := s3.New(sess).ListObjectsV2(input)
	if err != nil {
		if aerr, ok := err.(awserr.Error); ok {
			return false, fmt.Errorf("s3 list error: %s: %v", aerr.Code(), aerr.Message())
		}
		return false, err
	}
	return aws.Int64Value(out.KeyCount) > 0, nil
}
