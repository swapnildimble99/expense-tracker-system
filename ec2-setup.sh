#!/bin/bash
# EC2 Setup Script for Expense Tracker

#!/bin/bash

echo "Updating system..."
sudo yum update -y

echo "Installing Docker..."
sudo yum install docker -y

echo "Starting Docker..."
sudo systemctl start docker
sudo systemctl enable docker

echo "Adding user to Docker group..."
sudo usermod -aG docker ec2-user

echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "Done! Run: newgrp docker"
