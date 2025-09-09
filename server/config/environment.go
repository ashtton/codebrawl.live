package config

import "os"

const AwsRegion = "us-east-1"

var AwsAccountId string
var AwsAccountSecret string

var S3SubmissionsBucket string

var SubmissionsQueueUrl string
var ResultsQueueUrl string

func LoadEnvironment() {
	AwsAccountId = os.Getenv("AWS_ACCOUNT_ID")
	AwsAccountSecret = os.Getenv("AWS_ACCOUNT_SECRET")
	S3SubmissionsBucket = os.Getenv("S3_SUBMISSIONS")
	SubmissionsQueueUrl = os.Getenv("SQS_SUBMISSIONS")
	ResultsQueueUrl = os.Getenv("SQS_RESULTS")
}
