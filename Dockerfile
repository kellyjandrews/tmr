FROM ubuntu:latest

# Set noninteractive installation to avoid prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install necessary dependencies
RUN apt-get update && \
    apt-get install -y \
    python3 \
    python3-pip \
    unzip \
    curl \
    wget \
    apt-transport-https \
    gnupg \
    lsb-release \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Amazon Q CLI using .deb package
RUN curl --proto '=https' --tlsv1.2 -sSf https://desktop-release.q.us-east-1.amazonaws.com/latest/amazon-q.deb -o amazon-q.deb && \
    apt-get update && \
    apt-get install -y ./amazon-q.deb && \
    rm amazon-q.deb && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create a working directory
WORKDIR /workspace

# Verify installation
RUN q --version

# Set entrypoint to bash for interactive use
ENTRYPOINT ["/bin/bash"]