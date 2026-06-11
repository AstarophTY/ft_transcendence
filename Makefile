.PHONY: all up down build logs ssl clean re ps

ifneq (,$(wildcard .env))
    include .env
    export
endif

all: ssl up

ssl:
	@bash scripts/gen-ssl.sh

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build --no-cache

logs:
	docker compose logs -f

clean:
	docker compose down -v --remove-orphans
	docker system prune -f

re: clean all

ps:
	docker compose ps
