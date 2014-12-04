#!/bin/bash

# don't run from somewhere else
if [ ! -f browser/podlogin.js -a -f deploy.sh ] ; then
  exit 1
fi

VERSION=0.1.3-alpha-`id -un`
# VERSION=0.1.3-beta3
echo VERSION=$VERSION


echo "checking syntax..."
#for jsfile in *.js */*.js */*/*.js; do
for jsfile in browser/podlogin.js browser/podlogin-iframe.js; do
   #if ! node $jsfile; then
   #   # exit 1
   #   echo Be Careful
   #fi
   jshint $jsfile
done

echo "replacing !!VERSION!!..."
rm -rf .versioned
mkdir .versioned
cp -a * .versioned
cd .versioned

for f in `find . -name '*.js' -o -name '*.html' -o -name '*.txt' -type f`; do
  # echo $f
  sed -i'' "s/!!VERSION!!/$VERSION/" $f
done

echo "copying to servers..."
# include https://es6-promises.s3.amazonaws.com/es6-promise-2.0.0.min.js" ?
echo "// combined js files, for version $VERSION" > crosscloud.js
cat browser/podlogin.js lib/webcircuit.js lib/main.js >> crosscloud.js
rsync -aR RELEASE.txt crosscloud.js browser/podlogin.js site/index.html site/style.css example site/doctest test root@www1.crosscloud.org:/sites/crosscloud.org/$VERSION/
rsync browser/podlogin-iframe.html browser/podlogin-iframe.js root@podlogin.org:/sites/podlogin.org/$VERSION/
echo done
