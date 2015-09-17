#!/bin/bash

DEPLOY_ENV="staging"

if [[ ($# -eq 1 ) && $1 =~ "pro" ]]; then
  DEPLOY_ENV='production'
fi


read -p "Deploy to $DEPLOY_ENV? " -n 1 -r
echo    # (optional) move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

DISTDIR="./dist"
GITCONFIG="$DISTDIR/.git/config"
HERE=`pwd`
DATE=`date +"%Y-%m-%d"`
SHA=`git rev-parse --short=8 HEAD`

echo "Building gh-pages branch in $DISTDIR for SHA $SHA on $DATE"

# 1) make sure dist folder variable is not empty and folder exists
if [ -z "$DISTDIR" ]; then
  echo "DISTDIR variable is empty, aborting!"
  exit 1
fi
mkdir -p $DISTDIR

# 2) Checkout a new clone of our repo into the dist directory
# which will contain the gh-pages branch we will deploy
if [ -e "$GITCONFIG" ]
then
  echo "found existing git clone in $DISTDIR"
  cd $DISTDIR &&\
  git checkout gh-pages &&\
  git pull
else
  echo "cloning building-models repo in $DISTDIR"
  rm -rf "$DISTDIR/*" &&\
  git clone git@github.com:concord-consortium/building-models.git $DISTDIR &&\
  cd $DISTDIR &&\
  echo "checking out gh-pages branch" &&\
  git checkout gh-pages
fi

# 3) clear out the dist directory
echo "Clearing out existing files"
git rm -rf .
git clean -fxd

cd $HERE

# 4) Build our project using gulp into the dist folder
echo "Rebuilding app"
ENVIRONMENT=$DEPLOY_ENV gulp build-all --production --buildInfo '$SHA built on $DATE' &&\


# 5a) Either Deploy Production to S3,
if [[ $DEPLOY_ENV =~ "pro" ]]
then
  echo
  echo Deploying to S3
  echo
  s3_website push

# 5b) Or Deploy Staging to gh-pages
else
  echo
  echo Deploying to gh-page
  echo
  cd $DISTDIR
  git add * &&\
  git commit -a -m "deployment for $SHA built on $DATE" &&\
  git push origin gh-pages
fi

# 6) Let rollbars know of our new staging deploy
# https://rollbar.com/knowuh/Ivy deployment tracking
ACCESS_TOKEN=daa3852e6c4f46008fc4043793a0ff38
ENVIRONMENT=$DEPLOY_ENV
LOCAL_USERNAME=`whoami`
REVISION=`git log -n 1 --pretty=format:"%H"`
curl https://api.rollbar.com/api/1/deploy/ \
  -F access_token=$ACCESS_TOKEN \
  -F environment=$ENVIRONMENT \
  -F revision=$REVISION \
  -F local_username=$LOCAL_USERNAME
