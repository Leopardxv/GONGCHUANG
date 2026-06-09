#!/bin/bash
cd "$(dirname "$0")/.."
docker build -t linux-student:latest docker/student-image/
echo "Student image built: linux-student:latest"
