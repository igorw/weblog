all:
	bundle exec jekyll build

web:
	bundle exec jekyll serve --watch --drafts
