package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/aws/aws-sdk-go/service/sqs/sqsiface"
)

const timeLimitSec = 120

var sess *session.Session
var s3Downloader *s3manager.Downloader
var s3Uploader *s3manager.Uploader
var sqsClient sqsiface.SQSAPI

var sqsQueueURL string
var submissionsS3Bucket string
var resultsS3Bucket string

func main() {
	log.Println("Code Brawl Judge Fargate task started. Listening for SQS messages...")

	for {
		receiveInput := &sqs.ReceiveMessageInput{
			QueueUrl:            aws.String(sqsQueueURL),
			MaxNumberOfMessages: aws.Int64(1),
			WaitTimeSeconds:     aws.Int64(20),
			VisibilityTimeout:   aws.Int64(300),
		}

		resp, err := sqsClient.ReceiveMessage(receiveInput)
		if err != nil {
			log.Printf("Error receiving SQS messages: %v", err)
			time.Sleep(5 * time.Second)
			continue
		}

		if len(resp.Messages) == 0 {
			log.Println("No messages in queue, waiting...")
			continue
		}

		for _, message := range resp.Messages {
			log.Printf("Processing message ID: %s", *message.MessageId)

			var submission Submission
			err := json.Unmarshal([]byte(*message.Body), &submission)
			if err != nil {
				log.Printf("Error unmarshaling message body '%s': %v", *message.Body, err)
				continue
			}

			result, processErr := processSubmission(context.Background(), submission)
			if processErr != nil {
				log.Printf("Error processing battle %s: %v", submission.SubmissionID, processErr)
				result.Status = "ERROR"
				result.Error = processErr.Error()
				result.JudgeLog += fmt.Sprintf("\nJudge process error: %v", processErr)
			}

			jsonResult, _ := json.Marshal(result)
			uploadErr := uploadFileToS3(resultsS3Bucket, fmt.Sprintf("%s/results.json", submission.SubmissionID), jsonResult)
			if uploadErr != nil {
				log.Printf("Failed to upload battle results for %s: %v", submission.SubmissionID, uploadErr)
			}

			deleteInput := &sqs.DeleteMessageInput{
				QueueUrl:      aws.String(sqsQueueURL),
				ReceiptHandle: message.ReceiptHandle,
			}
			_, err = sqsClient.DeleteMessage(deleteInput)
			if err != nil {
				log.Printf("Error deleting message %s from SQS: %v", *message.MessageId, err)
			} else {
				log.Printf("Successfully processed and deleted message %s for battle %s", *message.MessageId, submission.SubmissionID)
			}
		}
	}
}

func getFileExtension(language string) string {
	switch language {
	case "python":
		return "py"
	case "javascript":
		return "js"
	case "typescript":
		return "ts"
	case "go":
		return "go"
	case "java":
		return "java"
	case "kotlin":
		return "kt"
	default:
		return "txt"
	}
}
