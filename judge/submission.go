package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Submission struct {
	SubmissionID  string `json:"submissionId"`
	ChallengeID   string `json:"challengeId"`
	UserCodeS3Key string `json:"userCodeS3Key"`
	Language      string `json:"language"`
	MaxTestCases  *int   `json:"maxTestCases,omitempty"`
}

type SubmissionResult struct {
	SubmissionID  string   `json:"submissionId"`
	Status        string   `json:"status"` // e.g., "SUCCESS", "TEST_FAILURE", "TIMEOUT", "COMPILE_ERROR", "ERROR"
	Output        string   `json:"output"`
	Error         string   `json:"error"`
	DurationMs    int64    `json:"durationMs"`
	MemoryUsageKb int64    `json:"memoryUsageKb"`
	PassedTestIDs []string `json:"passedTestIds,omitempty"`
	FailedTestIDs []string `json:"failedTestIds,omitempty"`
	JudgeLog      string   `json:"judgeLog"`
}

func processSubmission(ctx context.Context, input Submission) (SubmissionResult, error) {
	log.Printf("Starting battle process for: %+v", input)

	result := SubmissionResult{
		SubmissionID: input.SubmissionID,
		Status:       "ERROR",
	}

	const challengesBucket = "codebrawl-challenges"

	tempDir, err := ioutil.TempDir("/tmp", "codebattle-")
	if err != nil {
		result.JudgeLog = fmt.Sprintf("Failed to create temp dir: %v", err)
		return result, fmt.Errorf("failed to create temp dir: %w", err)
	}
	defer os.RemoveAll(tempDir) // Clean up

	filename := "user_code." + getFileExtension(input.Language)
	if input.Language == "java" {
		filename = "UserCode.java"
	}
	userCodePath := filepath.Join(tempDir, filename)
	err = downloadFileFromS3(submissionsS3Bucket, input.UserCodeS3Key, userCodePath)
	if err != nil {
		result.JudgeLog = fmt.Sprintf("Failed to download user code: %v", err)
		return result, fmt.Errorf("failed to download user code: %w", err)
	}

	challengePrefix := fmt.Sprintf("%s/", input.ChallengeID)
	exists, err := s3PrefixExists(challengesBucket, challengePrefix)
	if err != nil {
		result.JudgeLog += fmt.Sprintf("S3 error checking challenge folder: %v\n", err)
		return result, fmt.Errorf("failed to check challenge folder: %w", err)
	}
	if !exists {
		result.Status = "FAILURE"
		errMsg := fmt.Sprintf("Challenge folder '%s' not found in bucket %s", challengePrefix, challengesBucket)
		result.Error = errMsg
		result.JudgeLog += errMsg
		return result, nil
	}

	testCasesPath := filepath.Join(tempDir, "test-cases.json")
	testCasesKey := filepath.Join(input.ChallengeID, "test-cases.json")
	err = downloadFileFromS3(challengesBucket, testCasesKey, testCasesPath)
	if err != nil {
		result.JudgeLog = fmt.Sprintf("Failed to download test cases: %v", err)
		return result, fmt.Errorf("failed to download test cases: %w", err)
	}

	data, err := os.ReadFile(testCasesPath)
	if err != nil {
		result.JudgeLog = fmt.Sprintf("Failed to read test cases file: %v", err)
		return result, fmt.Errorf("failed to read test cases file: %w", err)
	}

	type TestCase struct {
		ID       string `json:"id"`
		Input    string `json:"input"`
		Expected string `json:"expected"`
	}
	var tests []TestCase
	if err := json.Unmarshal(data, &tests); err != nil {
		result.JudgeLog = fmt.Sprintf("Failed to parse test cases JSON: %v", err)
		return result, fmt.Errorf("failed to parse test cases: %w", err)
	}
	if len(tests) == 0 {
		result.Status = "FAILURE"
		result.Error = "No test cases found"
		return result, nil
	}

	maxToRun := len(tests)
	if input.MaxTestCases != nil && *input.MaxTestCases >= 0 && *input.MaxTestCases < maxToRun {
		maxToRun = *input.MaxTestCases
	}

	startTime := time.Now()
	failedIDs := []string{}
	passedIDs := []string{}
	var lastStdout, lastStderr string
	var anyTimeout bool
	var maxMemKb int64 = 0

	cmdArgs, compErrMsg, compErr := prepareExecution(userCodePath, input.Language)
	if compErr != nil {
		result.Status = "COMPILE_ERROR"
		result.Error = compErrMsg
		result.JudgeLog += compErrMsg
		return result, nil
	}

	for i := 0; i < maxToRun; i++ {
		ts := tests[i]
		tctx, cancel := context.WithTimeout(ctx, time.Duration(timeLimitSec)*time.Second)
		stdout, stderr, timedOut, memKb, _ := runPrepared(tctx, cmdArgs, ts.Input)
		cancel()
		if memKb > maxMemKb {
			maxMemKb = memKb
		}
		lastStdout, lastStderr = stdout, stderr
		if timedOut {
			anyTimeout = true
			failedIDs = append(failedIDs, ts.ID)
			break
		}

		norm := func(s string) string {
			return strings.TrimRight(strings.ReplaceAll(s, "\r\n", "\n"), "\n \t\r")
		}
		if norm(stdout) != norm(ts.Expected) {
			failedIDs = append(failedIDs, ts.ID)
			break
		} else {
			passedIDs = append(passedIDs, ts.ID)
		}
		if stderr != "" {
			log.Printf("Stderr for test %s: %s", ts.ID, stderr)
		}
	}

	duration := time.Since(startTime)
	result.DurationMs = duration.Milliseconds()

	result.PassedTestIDs = passedIDs
	result.FailedTestIDs = failedIDs
	result.MemoryUsageKb = maxMemKb

	if anyTimeout {
		result.Status = "TIMEOUT"
		result.Error = fmt.Sprintf("Code execution exceeded time limit during tests. First timeout on test ID(s): %v", failedIDs)
		result.Output = lastStdout
		log.Printf("Battle %s finished with status: %s", input.SubmissionID, result.Status)
		return result, nil
	}

	if len(failedIDs) > 0 {
		result.Status = "TEST_FAILURE"
		result.Error = fmt.Sprintf("Failed test case IDs: %s", strings.Join(failedIDs, ", "))
		result.Output = lastStdout
		if lastStderr != "" {
			result.JudgeLog += "\nLast stderr: " + lastStderr
		}
	} else {
		result.Status = "SUCCESS"
		result.Output = "All test cases passed"
	}

	log.Printf("Battle %s finished with status: %s", input.SubmissionID, result.Status)
	return result, nil
}
