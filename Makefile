SHELL = /bin/sh
UID := $(shell id -u)
COMPOSE = docker compose -f docker-compose.yaml

.PHONY: docker-up docker-down docker-restart docker-stop \
        node

# === DOCKER OPERATIONS ===
docker-up:
	@env UID=${UID} $(COMPOSE) up -d --remove-orphans

docker-down:
	@env UID=${UID} $(COMPOSE) down db -v

docker-restart: docker-down docker-up

docker-stop:
	@env UID=${UID} $(COMPOSE) stop

# === CONTAINER ACCESS ===
node:
	@env UID=${UID} $(COMPOSE) exec node sh