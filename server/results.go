package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/url"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/sqs"
)

func startS3EventConsumer(sess *session.Session, queueURL string) {
	sqsClient := sqs.New(sess)
	s3Client := s3.New(sess)

	go func() {
		for {
			out, err := sqsClient.ReceiveMessage(&sqs.ReceiveMessageInput{
				QueueUrl:            aws.String(queueURL),
				MaxNumberOfMessages: aws.Int64(10),
				WaitTimeSeconds:     aws.Int64(20),
				VisibilityTimeout:   aws.Int64(60),
			})

			if err != nil {
				time.Sleep(time.Second)
				continue
			}
			
			for _, m := range out.Messages {
				var ev struct {
					Records []struct {
						S3 struct {
							Bucket struct {
								Name string `json:"name"`
							} `json:"bucket"`
							Object struct {
								Key string `json:"key"`
							} `json:"object"`
						} `json:"s3"`
					} `json:"Records"`
				}

				if err := json.Unmarshal([]byte(*m.Body), &ev); err == nil {
					for _, r := range ev.Records {
						bucket := r.S3.Bucket.Name
						key, _ := url.QueryUnescape(r.S3.Object.Key)
						parts := strings.Split(key, "/")
						if len(parts) >= 2 && parts[len(parts)-1] == "results.json" {
							submissionID := parts[0]
							obj, err := s3Client.GetObject(&s3.GetObjectInput{Bucket: aws.String(bucket), Key: aws.String(key)})
							var payload []byte
							if err == nil {
								payload, _ = io.ReadAll(obj.Body)
								obj.Body.Close()
							} else {
								payload = []byte(fmt.Sprintf(`{"submissionId":"%s","bucket":"%s","key":"%s"}`, submissionID, bucket, key))
							}

							fmt.Printf("Received S3 event for submission %s %s\n", submissionID, payload)
						}
					}
				}

				_, _ = sqsClient.DeleteMessage(&sqs.DeleteMessageInput{
					QueueUrl:      aws.String(queueURL),
					ReceiptHandle: m.ReceiptHandle,
				})
			}
		}
	}()
}
