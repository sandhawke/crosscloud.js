#!/bin/bash

# don't run from somewhere else
if ! cd ../crosscloud-webapp-tools; then
  exit 1
fi

VERSION=0.1.2-alpha-`id -un`
echo VERSION=$VERSION

# do a javascript syntax check on everything
#
# this is why files start with
# if (typeof document !== "undefined") $(function(){
# 
# consider using jshint instead
# http://www.jshint.com/docs/

echo "checking syntax..."
for jsfile in *.js */*.js */*/*.js; do
   if ! node $jsfile; then
      exit 1
   fi
done

echo "replacing !!VERSION!!..."
rm -rf .versioned
mkdir .versioned
cp -a * .versioned
cd .versioned

for f in `find . -name '*.js' -o -name '*.html' -type f`; do
  # echo $f
  sed -i'' "s/!!VERSION!!/$VERSION/" $f
done

echo "copying to servers..."
rsync -aR crosscloud.js README.html example root@www1.crosscloud.org:/sites/crosscloud.org/$VERSION/
rsync -a switcher.html switcher.js root@podlogin.org:/sites/podlogin.org/$VERSION/
rsync -a network.html network.js root@fakepods.com:/sites/fakepods.com/_login/$VERSION/
echo done
