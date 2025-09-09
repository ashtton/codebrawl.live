# Stage 1: Build the Go Judge application
# We use golang:1.20-bookworm as a robust base for building.
FROM golang:1.25-bookworm AS go-builder

WORKDIR /app

# Copy go.mod and go.sum files to download Go modules
COPY go.mod ./
COPY go.sum ./
RUN go mod download

# Copy the rest of the Go judge application source code
COPY . .

# Build the Go judge executable
# CGO_ENABLED=0 is important for statically linking, making it portable.
# GOOS=linux ensures it builds for a Linux environment.
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/judge-app .

# Stage 2: Create the final runtime image with all necessary language runtimes
FROM debian:bookworm-slim

# Set environment variables for non-interactive apt commands
ENV DEBIAN_FRONTEND=noninteractive

# Update package lists and install necessary runtimes and compilers
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        git \
        build-essential \
        python3 \
        python3-pip \
        curl \
        gnupg \
        openjdk-17-jdk \
        && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js and npm from NodeSource (recommended for up-to-date versions)
ENV NODE_VERSION 20.x
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_VERSION nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update -y && \
    apt-get install -y --no-install-recommends nodejs && \
    npm install -g npm@latest tsx typescript && \
    rm -rf /var/lib/apt/lists/*

# Install Go runtime (for running user-submitted Go code)
ENV GO_VERSION 1.20
RUN curl -fsSL https://dl.google.com/go/go${GO_VERSION}.linux-amd64.tar.gz -o /tmp/go.tar.gz && \
    tar -xzf /tmp/go.tar.gz -C /usr/local && \
    rm /tmp/go.tar.gz
ENV PATH="/usr/local/go/bin:${PATH}"

# Install Kotlin compiler (kotlinc) system-wide
# Download the official Kotlin compiler command line tools and install to /opt/kotlin, symlink to /usr/local/bin
ENV KOTLIN_VERSION 1.9.24
RUN curl -fsSL https://github.com/JetBrains/kotlin/releases/download/v${KOTLIN_VERSION}/kotlin-compiler-${KOTLIN_VERSION}.zip -o /tmp/kotlin.zip && \
    apt-get update -y && apt-get install -y --no-install-recommends unzip && \
    unzip /tmp/kotlin.zip -d /opt && \
    mv /opt/kotlinc /opt/kotlin && \
    ln -sf /opt/kotlin/bin/kotlinc /usr/local/bin/kotlinc && \
    ln -sf /opt/kotlin/bin/kotlin /usr/local/bin/kotlin && \
    rm -f /tmp/kotlin.zip && \
    apt-get purge -y unzip && apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

# Create a dedicated, non-root user for security
RUN groupadd --system appuser && useradd --system --gid appuser appuser

# Copy the compiled Go judge application from the builder stage
COPY --from=go-builder /app/judge-app /app/judge-app

# Make the judge executable (still as root for now)
RUN chmod +x /app/judge-app

# --- REVISED /tmp permissions approach ---
# Change to root to set /tmp permissions if needed (it should already be world writable)
USER root
RUN chmod 1777 /tmp # Ensure /tmp is world-writable with sticky bit (standard /tmp permissions)
# Switch back to appuser for the rest
USER appuser
# Set WORKDIR after USER, so it's owned by appuser
WORKDIR /app
# --- End REVISED /tmp permissions approach ---

# Define the command to run when the container starts
CMD ["/app/judge-app"]