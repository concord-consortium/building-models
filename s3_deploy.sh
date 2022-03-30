#!/bin/bash

# Typically this is the Project name.
# The trailing slash is important
# Can be set to an empty string for working at the top level of the bucket
S3_BUCKET_PREFIX=''
# AWS CloudFront distribution ID
DISTRIBUTION_ID='EGVC56LSD4VPJ'
# AWS CloudFront distribution domain (not used as there are multiple domains for this project, see s3_website.yml)
# DISTRIBUTION_DOMAIN='sagemodeler.concord.org'
# name of branch to deploy to root of site
ROOT_BRANCH='production'
# Bucket to deploy to, typically this is 'model-resources', but some projects
# have their own buckets
S3_BUCKET='building-models-app.concord.org'
# location of built files
SRC_DIR='dist'

# exit when any command fails
set -e

# keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
# echo an error message before exiting
trap 'echo "\"${last_command}\" command exited with code $?."' EXIT

# extract current TAG if present
# the 2> is to prevent error messages when no match is found
# the || echo prevents script exit when it doesn't match
CURRENT_TAG=`git describe --tags --exact-match $GITHUB_SHA 2> /dev/null || echo ''`

# Extract the branch or tag name from the GITHUB_REF
# it should either be: refs/head/branch-name or
# or refs/tags/v1.2.3
# since we ought to know if this is a branch or tag based on the ref
# we could simplify the CURRENT_TAG approach above
BRANCH_OR_TAG=${GITHUB_REF#refs/*/}
echo branch or tag: $BRANCH_OR_TAG

# strip PT ID from branch name for branch builds
DEPLOY_DIR_NAME=$BRANCH_OR_TAG
PT_PREFIX_REGEX="^([0-9]{8,}-)(.+)$"
PT_SUFFIX_REGEX="^(.+)(-[0-9]{8,})$"
if [[ $DEPLOY_DIR_NAME =~ $PT_PREFIX_REGEX ]]; then
  DEPLOY_DIR_NAME=${BASH_REMATCH[2]}
fi
if [[ $DEPLOY_DIR_NAME =~ $PT_SUFFIX_REGEX ]]; then
  DEPLOY_DIR_NAME=${BASH_REMATCH[1]}
fi

# tagged builds deploy to /version/TAG_NAME
if [ "$BRANCH_OR_TAG" = "$CURRENT_TAG" ]; then
  mkdir -p _site/version
  S3_DEPLOY_DIR="version/$BRANCH_OR_TAG"
  DEPLOY_DEST="_site/$S3_DEPLOY_DIR"
  INVAL_PATHS=("/version/$BRANCH_OR_TAG/index.html" "/version/$BRANCH_OR_TAG/lara.html" "/version/$BRANCH_OR_TAG/report.html" "/version/$BRANCH_OR_TAG/sagemodeler.html")
  # in this case we are going to deploy this code to a subfolder of version
  # So ignore everything except this folder.
  # Currently this only escapes `.`
  S3_DEPLOY_DIR_ESCAPED=$(sed 's/[.]/[&]/g;' <<<"$S3_DEPLOY_DIR")
  IGNORE_ON_SERVER="^(?!$S3_BUCKET_PREFIX$S3_DEPLOY_DIR_ESCAPED/)"

# root branch builds deploy to root of site
elif [ "$BRANCH_OR_TAG" = "$ROOT_BRANCH" ]; then
  DEPLOY_DEST="_site"
  INVAL_PATHS=("/index.html" "/lara.html" "/report.html" "/sagemodeler.html")
  # in this case we are going to deploy this branch to the top level
  # so we need to ignore the version and branch folders
  IGNORE_ON_SERVER="^$S3_BUCKET_PREFIX(version/|branch/)"

# branch builds deploy to /branch/BRANCH_NAME
else
  mkdir -p _site/branch
  S3_DEPLOY_DIR="branch/$DEPLOY_DIR_NAME"
  DEPLOY_DEST="_site/$S3_DEPLOY_DIR"
  INVAL_PATHS=("/branch/$DEPLOY_DIR_NAME/index.html" "/branch/$DEPLOY_DIR_NAME/lara.html" "/branch/$DEPLOY_DIR_NAME/report.html" "/branch/$DEPLOY_DIR_NAME/sagemodeler.html")
  # in this case we are going to deploy this code to a subfolder of branch
  # So ignore everything except this folder.
  # Currently this only escapes `.`
  S3_DEPLOY_DIR_ESCAPED=$(sed 's/[.]/[&]/g;' <<<"$S3_DEPLOY_DIR")
  IGNORE_ON_SERVER="^(?!$S3_BUCKET_PREFIX$S3_DEPLOY_DIR_ESCAPED/)"
fi

# used by s3_website.yml
export S3_BUCKET_PREFIX
export IGNORE_ON_SERVER
export DISTRIBUTION_ID
# export DISTRIBUTION_DOMAIN
export S3_BUCKET

# copy files to destination
mv $SRC_DIR $DEPLOY_DEST

# deploy the site contents
echo Deploying "$BRANCH_OR_TAG" to "$S3_BUCKET:$S3_BUCKET_PREFIX$S3_DEPLOY_DIR"...
echo Pushing to S3
s3_website push --site _site

# Let rollbar know of our new deployment:
# https://rollbar.com/knowuh/Sage deployment tracking
ACCESS_TOKEN=daa3852e6c4f46008fc4043793a0ff38
if [ "$BRANCH_OR_TAG" = "production" ]; then
  ENVIRONMENT="production"
elif [ "$BRANCH_OR_TAG" = "master" ]; then
  ENVIRONMENT="staging"
else
  ENVIRONMENT="development"
fi
REVISION=`git log -n 1 --pretty=format:"%h"`
echo "Sending deploy notice to rollbar.com"
curl https://api.rollbar.com/api/1/deploy/ \
  -F access_token=$ACCESS_TOKEN \
  -F environment=$ENVIRONMENT \
  -F revision="\`$REVISION $BRANCH_OR_TAG\`" \
  -F local_username=Travis\
  -F comment="available at https://sage.concord.org/branch/$BRANCH_OR_TAG/"

# explicit CloudFront invalidation to workaround s3_website gem invalidation bug
# with origin path (https://github.com/laurilehmijoki/s3_website/issues/207).
echo Invalidating CloudFront at "${INVAL_PATHS[@]}"...
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "${INVAL_PATHS[@]}"
