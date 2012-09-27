build:
	bin/balrog build

watch:
	while inotifywait $(shell find . -name '*.md'); do make build; done

.PHONY: build
