SHELL = /bin/sh
UID := $(shell id -u)

.PHONY: node

node:
	@env UID=${UID} npm run dev
