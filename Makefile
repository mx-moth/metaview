SOURCES := $(shell find \
	assets/ \
	content_scripts/ \
	popup/ \
	manifest.json \
	README.md \
	-type f)

LOGO_SIZES := 16 32 48 96
LOGOS := $(LOGO_SIZES:%=assets/logo-%.png)

.PHONY: all
all: bundle

.PHONY: bundle firefox-extension chrome-extension
bundle: firefox-extension chrome-extension
firefox-extension: metaview.zip
chrome-extension: metaview.zip

.PHONY: logos
logos: $(LOGOS) extra/chrome-app-logo.png

metaview.zip: logos $(SOURCES)
	rm -f $@
	zip -r $@ $(SOURCES)


assets/logo-%.png: assets/icons/share.svg
	inkscape -z -e "$@" -h "$(*F)" "$<" ;
	gm convert "$@" \
		-thumbnail "$(*F)x$(*F)>" \
		-background transparent \
		-gravity center \
		-extent "$(*F)x$(*F)" \
		"$@"

extra/chrome-app-logo.png: assets/icons/share.svg
	inkscape -z -e "$@" -h 96 "$<"
	gm convert "$@" \
		-thumbnail "128x128>" \
		-background transparent \
		-gravity center \
		-extent "128x128" \
		"$@"
