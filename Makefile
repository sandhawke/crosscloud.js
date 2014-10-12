VERSION=0.1.1-alpha-$(shell id -un)
#VERSION=0.1.1

default:
	@echo 'do you mean make deploy?'

deploy:
	node syntax-check.js  # check for syntax errors in javascript now OMFG
	mkdir -p .versioned/example
	for f in *.html *.js example/*.html example/*.js; do sed -e 's/!!VERSION!!/$(VERSION)/' < $$f > .versioned/$$f; done
	cd .versioned; rsync -aR crosscloud.js README.html example root@www1.crosscloud.org:/sites/crosscloud.org/$(VERSION)/
	cd .versioned; rsync -a switcher.html switcher.js root@podlogin.org:/sites/podlogin.org/$(VERSION)/
	cd .versioned; rsync -a network.html network.js root@fakepods.com:/sites/fakepods.com/_login/$(VERSION)/
