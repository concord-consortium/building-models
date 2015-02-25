#!/bin/bash

# build github pages
jspm bundle-sfx javascripts/building-models public/app.js &&\
cp ./public/production_index.html ./public/index.html &&\
git subtree push --prefix public  origin gh-pages