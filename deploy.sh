#!/bin/bash

# AWS S3 + CloudFront Deployment Script
# Usage: ./deploy.sh <bucket-name> [--create]

BUCKET_NAME=$1
CREATE_BUCKET=$2

if [ -z "$BUCKET_NAME" ]; then
    echo "Usage: ./deploy.sh <bucket-name> [--create]"
    echo "Example: ./deploy.sh my-alphabet-app --create"
    exit 1
fi

# Create bucket if --create flag is passed
if [ "$CREATE_BUCKET" == "--create" ]; then
    echo "Creating S3 bucket: $BUCKET_NAME"
    aws s3 mb s3://$BUCKET_NAME
    
    # Enable static website hosting
    aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html
    
    # Set bucket policy for public read access
    cat > /tmp/bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF
    
    # Disable block public access
    aws s3api put-public-access-block \
        --bucket $BUCKET_NAME \
        --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    
    # Apply bucket policy
    aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file:///tmp/bucket-policy.json
    
    echo "Bucket created and configured for static hosting"
fi

echo "Deploying to S3 bucket: $BUCKET_NAME"

# Sync HTML files with short cache
aws s3 sync . s3://$BUCKET_NAME \
    --exclude "*.md" \
    --exclude ".git/*" \
    --exclude "deploy.sh" \
    --exclude "*.png" \
    --exclude "*.mp3" \
    --cache-control "max-age=300"

# Sync images with long cache
aws s3 sync ./assets s3://$BUCKET_NAME/assets \
    --exclude "*.md" \
    --include "*.png" \
    --cache-control "max-age=31536000"

# Sync audio with long cache
aws s3 sync ./assets/sounds s3://$BUCKET_NAME/assets/sounds \
    --include "*.mp3" \
    --cache-control "max-age=31536000"

# Set correct content types
aws s3 cp s3://$BUCKET_NAME/index.html s3://$BUCKET_NAME/index.html \
    --content-type "text/html" \
    --metadata-directive REPLACE \
    --cache-control "max-age=300"

aws s3 cp s3://$BUCKET_NAME/styles.css s3://$BUCKET_NAME/styles.css \
    --content-type "text/css" \
    --metadata-directive REPLACE \
    --cache-control "max-age=300"

aws s3 cp s3://$BUCKET_NAME/script.js s3://$BUCKET_NAME/script.js \
    --content-type "application/javascript" \
    --metadata-directive REPLACE \
    --cache-control "max-age=300"

REGION=$(aws configure get region)
echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your site is available at:"
echo "http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""
echo "For CloudFront CDN, create a distribution pointing to this S3 bucket."
