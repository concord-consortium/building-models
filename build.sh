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
else
  echo "cloning building-models repo in $DISTDIR"
  git clone git@github.com:concord-consortium/building-models.git $DISTDIR &&\
  cd $DISTDIR &&\
  echo "checking out gh-pages branch" &&\
  git checkout gh-pages
  echo "Done."
  cd $HERE
fi

# 2) Build our project using gulp:
gulp build-all &&\

# 2) Bundle our app using jspm
jspm bundle-sfx javascripts/building-models dist/app.js &&\

# 3) Copy files
cp ./src/production_index.html $DISTDIR/index.html &&\
cp -r ./src/assets/* ./dist &&\

cp ./public/css/app.css ./dist/css/app.css &&\
cp ./src/javascripts/jsPlumb.js ./dist/jsPlumb.js &&\

# 5) Commit and push
cd dist &&\
git checkout gh-pages &&\
git pull &&\
git add * &&\
git commit -a -m "deployment for $SHA built on $DATE" &&\
git push