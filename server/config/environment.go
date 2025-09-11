package config

import (
	"os"
	"strconv"
)

const AwsRegion = "us-east-1"

var AwsAccountId string
var AwsAccountSecret string

var S3SubmissionsBucket string

var SubmissionsQueueUrl string
var ResultsQueueUrl string

var Port string

var RedisURL string

var RoomMaxUsers int

func LoadEnvironment() {
	AwsAccountId = os.Getenv("AWS_ACCOUNT_ID")
	AwsAccountSecret = os.Getenv("AWS_ACCOUNT_SECRET")
	S3SubmissionsBucket = os.Getenv("S3_SUBMISSIONS")
	SubmissionsQueueUrl = os.Getenv("SQS_SUBMISSIONS")
	ResultsQueueUrl = os.Getenv("SQS_RESULTS")
	Port = os.Getenv("PORT")
	RedisURL = os.Getenv("REDIS_URL")
	if v := os.Getenv("ROOM_MAX_USERS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			RoomMaxUsers = n
		}
	}
}
