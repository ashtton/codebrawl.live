package main

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os/exec"
	"path/filepath"
	"syscall"
)

func prepareExecution(codePath, language string) (cmdArgs []string, errMsg string, err error) {
	workDir := filepath.Dir(codePath)
	switch language {
	case "python":
		return []string{"python3", codePath}, "", nil
	case "javascript":
		return []string{"node", codePath}, "", nil
	case "typescript":
		return []string{"npx", "-y", "tsx", codePath}, "", nil
	case "go":
		binPath := filepath.Join(workDir, "user_code_exec")
		compileCmd := exec.Command("go", "build", "-o", binPath, codePath)
		out, compErr := compileCmd.CombinedOutput()
		if compErr != nil {
			return nil, fmt.Sprintf("Compilation error: %v\nOutput: %s", compErr, out), compErr
		}
		return []string{binPath}, "", nil
	case "java":
		compileCmd := exec.Command("javac", codePath)
		out, compErr := compileCmd.CombinedOutput()
		if compErr != nil {
			return nil, fmt.Sprintf("Compilation error: %v\nOutput: %s", compErr, out), compErr
		}
		return []string{"java", "-cp", workDir, "UserCode"}, "", nil
	case "kotlin":
		jarPath := filepath.Join(workDir, "user_code.jar")
		compileCmd := exec.Command("kotlinc", codePath, "-include-runtime", "-d", jarPath)
		out, compErr := compileCmd.CombinedOutput()
		if compErr != nil {
			return nil, fmt.Sprintf("Compilation error: %v\nOutput: %s", compErr, out), compErr
		}
		return []string{"java", "-jar", jarPath}, "", nil
	default:
		return nil, fmt.Sprintf("Unsupported language: %s", language), fmt.Errorf("unsupported language: %s", language)
	}
}

func runPrepared(ctx context.Context, cmdArgs []string, stdin string) (stdout, stderr string, timeout bool, memKb int64, startErr error) {
	if len(cmdArgs) == 0 {
		return "", "invalid command", false, 0, fmt.Errorf("empty cmdArgs")
	}
	var cmd *exec.Cmd
	if len(cmdArgs) == 1 {
		cmd = exec.CommandContext(ctx, cmdArgs[0])
	} else {
		cmd = exec.CommandContext(ctx, cmdArgs[0], cmdArgs[1:]...)
	}
	var stdoutBuf, stderrBuf bytes.Buffer
	cmd.Stdout = &stdoutBuf
	cmd.Stderr = &stderrBuf
	if stdin != "" {
		cmd.Stdin = bytes.NewBufferString(stdin)
	}
	if err := cmd.Start(); err != nil {
		return "", fmt.Sprintf("Failed to start user code: %v", err), false, 0, err
	}
	err := cmd.Wait()
	if ctx.Err() == context.Canceled || ctx.Err() == context.DeadlineExceeded {
		log.Printf("User code timed out after %d seconds by context", timeLimitSec)
		return stdoutBuf.String(), stderrBuf.String(), true, 0, nil
	} else if err != nil {
		log.Printf("User code execution error: %v, Stderr: %s", err, stderrBuf.String())
		return stdoutBuf.String(), stderrBuf.String(), false, 0, nil
	}
	var peak int64 = 0
	if ps := cmd.ProcessState; ps != nil {
		if usage, ok := ps.SysUsage().(*syscall.Rusage); ok && usage != nil {
			peak = usage.Maxrss
		}
	}
	log.Printf("User code executed successfully")
	return stdoutBuf.String(), stderrBuf.String(), false, peak, nil
}
