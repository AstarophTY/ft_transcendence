.PHONY: all up down build logs ssl clean re ps dev

ifneq (,$(wildcard .env))
    include .env
    export
endif

DATABASE_URL_DEV := postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@localhost:5433/$(POSTGRES_DB)
REDIS_URL_DEV := redis://:$(REDIS_PASSWORD)@localhost:6380

HOST_IP := $(shell ip route get 1 2>/dev/null | awk '{print $$(NF-2);exit}')
ifeq ($(HOST_IP),)
    HOST_IP := host-gateway
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

dev: ssl
	HOST_IP=$(HOST_IP) docker compose -f compose.yaml -f compose.dev.yaml up -d postgres redis nginx-dev
	@echo "Waiting for PostgreSQL to be ready..."
	@until docker compose exec -T postgres pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB) >/dev/null 2>&1; do \
		sleep 1; \
	done
	@echo "PostgreSQL is ready."
	cd backend && [ -d node_modules ] || npm install
	cd frontend && [ -d node_modules ] || npm install
	cd backend && npx prisma generate
	cd backend && DATABASE_URL="$(DATABASE_URL_DEV)" npx prisma migrate deploy
	npx --yes concurrently -k -s first -n "backend,frontend" -c "blue,green" \
		"cd backend && DATABASE_URL=\"$(DATABASE_URL_DEV)\" REDIS_URL=\"$(REDIS_URL_DEV)\" npm run start:dev" \
		"cd frontend && npm run dev"
