#!/bin/bash

DISTDIR="./dist" 
GITCONFIG="$DISTDIR/.git/config"
HERE=`pwd`
DATE=`date +"%Y-%m-%d"`
SHA=`git rev-parse --short=8 HEAD`

echo "Building gh-pages branch in $DISTDIR for SHA $SHA on $DATE"

# 1) Checkout a new clone of our repo into the dist directory
# which will contain the gh-pages branch we will deploy
if [ -e "$GITCONFIG" ]
then
  echo "found existing git clone in $DISTDIR"
  cd $DISTDIR &&\
  git checkout gh-pages &&\
  git pull
else
  echo "cloning building-models repo in $DISTDIR"
  git clone git@github.com:concord-consortium/building-models.git $DISTDIR &&\
  cd $DISTDIR &&\
  echo "checking out gh-pages branch" &&\
  git checkout gh-pages
fi

cd $HERE

# 2) Build our project using gulp:
gulp build-all &&\

# 3) Bundle our app using jspm
jspm bundle-sfx javascripts/app-view dist/app.js &&\

# 4) Copy files
cp -r ./src/assets/* $DISTDIR &&\
sed "s/__BUILD_INFO__/$SHA built on $DATE/g" ./src/production_index.html > $DISTDIR/index.html &&\
cp ./public/css/app.css $DISTDIR/css/app.css &&\
cp ./src/javascripts/jsPlumb.js $DISTDIR/jsPlumb.js &&\

# 5) Commit and push
cd $DISTDIR
git add * &&\
git commit -a -m "deployment for $SHA built on $DATE" &&\
git push origin gh-pages