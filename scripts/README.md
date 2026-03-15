# Deployment Automation

This directory contains scripts and configurations for automating the deployment of NewsPrism to Google Cloud.

## Files

- `deploy.sh`: A shell script that builds the container image using Google Cloud Build and deploys it to Cloud Run.
- `cloud-run.yaml`: A declarative configuration file for Cloud Run, which can be used with `gcloud run services replace`.
- `Dockerfile`: The container definition for the application.

## Usage

### 1. Prerequisites
- Google Cloud SDK installed and configured.
- A Google Cloud project with billing enabled.
- The following APIs enabled:
  - Cloud Build API
  - Cloud Run API
  - Artifact Registry API

### 2. Deployment
To deploy the application, run the following command from the root directory:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 3. Declarative Deployment
To update the service using the YAML configuration:

```bash
gcloud run services replace scripts/cloud-run.yaml --region europe-west2
```
