#!/bin/bash

# build github pages
brunch build --production &&\
git subtree push --prefix public  origin gh-pages