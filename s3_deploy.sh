#!/bin/sh

# this will deploy the current public folder to a subfolder in the s3 bucket
# the subfolder is the name of the TRAVIS_BRANCH
if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
	echo "skipping deploy to S3: this is a pull request"
	exit 0
fi

DATE=`date +"%Y-%m-%d"`
SHA=`git rev-parse --short=8 HEAD`

echo "Rebuilding app"
ENVIRONMENT=$DEPLOY_ENV
npm run build

rm -rf _site

if [ "$TRAVIS_BRANCH" = "production" ]; then
  mv dist _site
else
  # the 2> is to prevent error messages when no match is found
  CURRENT_TAG=`git describe --tags --exact-match $TRAVIS_COMMIT 2> /dev/null`
  if [ "$TRAVIS_BRANCH" = "$CURRENT_TAG" ]; then
    # this is a tag build
    mkdir -p _site/version
    DEPLOY_DIR=version/$TRAVIS_BRANCH
  else
    mkdir -p _site/branch
    DEPLOY_DIR=branch/$TRAVIS_BRANCH
  fi
  mv dist _site/$DEPLOY_DIR
  export DEPLOY_DIR
fi
s3_website push

# Let rollbars know of our new deployment:
# https://rollbar.com/knowuh/Sage deployment tracking
ACCESS_TOKEN=daa3852e6c4f46008fc4043793a0ff38
if [ "$TRAVIS_BRANCH" = "production" ]; then
  ENVIRONMENT="production"
elif [ "$TRAVIS_BRANCH" = "master" ]; then
  ENVIRONMENT="staging"
else
  ENVIRONMENT="development"
fi
REVISION=`git log -n 1 --pretty=format:"%h"`
curl https://api.rollbar.com/api/1/deploy/ \
  -F access_token=$ACCESS_TOKEN \
  -F environment=$ENVIRONMENT \
  -F revision="\`$REVISION $TRAVIS_BRANCH\`" \
  -F local_username=Travis\
  -F comment="available at https://sage.concord.org/branch/$TRAVIS_BRANCH/"
