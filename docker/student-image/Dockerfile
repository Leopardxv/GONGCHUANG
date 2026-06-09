FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash coreutils git vim nano python3 gcc g++ make man-db tree \
    curl wget sudo ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash student \
    && echo "student ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/student \
    && chmod 0440 /etc/sudoers.d/student

USER student
WORKDIR /home/student
