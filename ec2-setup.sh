#!/bin/bash
# EC2 Setup Script for Expense Tracker

echo "Updating system packages..."
sudo yum update -y

echo "Installing Docker..."
sudo amazon-linux-extras install docker -y
|| sudo yum install docker -y

echo "Starting Docker service..."
sudo service docker start
sudo systemctl enable docker

echo "Adding ec2-user to docker group..."
sudo usermod -a -G docker ec2-user

echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "Docker and Docker Compose installed successfully."
echo "Please log out and log back in, or run 'newgrp docker' to use docker without sudo."

echo ""
echo "To run the application, navigate to the project directory and run:"
echo "  docker-compose up -d --build"
echo ""
echo "To ensure external access, make sure your EC2 Security Group allows inbound traffic on port 3000 (Frontend) and 5000 (Backend API)."
