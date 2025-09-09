package main

import (
	"log"
	"os"

	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/aws/aws-sdk-go/service/sqs"
)

func init() {
	sess = session.Must(session.NewSession())
	s3Downloader = s3manager.NewDownloader(sess)
	s3Uploader = s3manager.NewUploader(sess)
	sqsClient = sqs.New(sess)

	sqsQueueURL = os.Getenv("SQS_QUEUE_URL")
	if sqsQueueURL == "" {
		log.Fatal("SQS_QUEUE_URL environment variable is not set.")
	}
	submissionsS3Bucket = os.Getenv("SUBMISSIONS_S3_BUCKET")
	if submissionsS3Bucket == "" {
		log.Fatal("SUBMISSIONS_S3_BUCKET environment variable is not set.")
	}
	resultsS3Bucket = os.Getenv("RESULTS_S3_BUCKET")
	if resultsS3Bucket == "" {
		log.Fatal("RESULTS_S3_BUCKET environment variable is not set.")
	}

	log.Printf("Judge initialized: SQS URL: %s, Submissions Bucket: %s, Results Bucket: %s",
		sqsQueueURL, submissionsS3Bucket, resultsS3Bucket)
}
