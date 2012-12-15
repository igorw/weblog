build:
	bin/balrog

serve:
	php -S localhost:8080 -t web web/index.php

watch:
	while inotifywait $(shell find . -name '*.md'); do make build; done

.PHONY: build
