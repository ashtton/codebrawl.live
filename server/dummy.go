package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"server/config"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/aws/aws-sdk-go/service/sqs"
)

type Submission struct {
	SubmissionID  string `json:"submissionId"`
	ChallengeID   string `json:"challengeId"`
	UserCodeS3Key string `json:"userCodeS3Key"`
	Language      string `json:"language"`
}

func sendDummySubmission() {
	creds := credentials.NewStaticCredentials(config.AwsAccountId, config.AwsAccountSecret, "")

	sess := session.Must(session.NewSessionWithOptions(session.Options{
		SharedConfigState: session.SharedConfigEnable,
		Config: aws.Config{
			Region:      aws.String(config.AwsRegion),
			Credentials: creds,
		},
	}))

	startS3EventConsumer(sess, config.ResultsQueueUrl)

	sqsClient := sqs.New(sess, aws.NewConfig().WithRegion("us-east-1"))
	s3Uploader := s3manager.NewUploader(sess)

	submissionId := "submission-" + fmt.Sprintf("%d", time.Now().Unix())

	submission := Submission{
		SubmissionID:  submissionId,
		UserCodeS3Key: fmt.Sprintf("%s/user_code.java", submissionId), // Example S3 key: submission-123456789/user_code.py
		ChallengeID:   "challenge-1",                                  // Example challenge ID
		Language:      "kotlin",
	}

	// 1. Create a dummy Python file content
	dummyPythonCode := `
fun main() {
        val name = readln()
        println("hi")
}
`
	log.Printf("Uploading dummy Python code to s3://%s/%s", config.S3SubmissionsBucket, submission.UserCodeS3Key)
	_, err := s3Uploader.Upload(&s3manager.UploadInput{
		Bucket: aws.String(config.S3SubmissionsBucket),
		Key:    aws.String(submission.UserCodeS3Key),
		Body:   bytes.NewReader([]byte(dummyPythonCode)), // Convert string to []byte for uploading
		ACL:    aws.String(s3.BucketCannedACLPublicRead), // Optional: make it publicly readable if needed for debugging
	})
	if err != nil {
		log.Fatalf("Failed to upload dummy Python code to S3: %v", err)
	}
	log.Printf("Successfully uploaded dummy Python code to S3: s3://%s/%s", config.S3SubmissionsBucket, submission.UserCodeS3Key)

	messageBody, err := json.Marshal(submission)
	if err != nil {
		log.Fatalf("Failed to marshal submission: %v", err)
	}

	sendMessageResult, err := sqsClient.SendMessage(&sqs.SendMessageInput{
		MessageBody: aws.String(string(messageBody)),
		QueueUrl:    aws.String(config.SubmissionsQueueUrl),
	})

	if err != nil {
		log.Fatalf("Failed to send message to SQS: %v", err)
	}

	log.Printf("Successfully sent submission %s to SQS. Message ID: %s", submission.SubmissionID, *sendMessageResult.MessageId)
}
