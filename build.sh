#!/bin/bash

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
gulp build-all --production --buildInfo '$SHA built on $DATE' &&\

# 5) Commit and push
cd $DISTDIR 
git add * &&\
git commit -a -m "deployment for $SHA built on $DATE" &&\
git push origin gh-pages
