.PHONY: up down build logs migrate shell test seed seed-demo

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

migrate:
	docker compose exec backend python manage.py migrate

shell:
	docker compose exec backend python manage.py shell

seed:
	docker compose exec backend python manage.py seed_admin

seed-demo:
	docker compose exec backend python manage.py seed_demo

test:
	docker compose exec backend pytest

test-local:
	cd backend && pytest
