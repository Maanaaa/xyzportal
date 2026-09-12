.PHONY: install dev start build push clean help logs shell test

# Default target
help:
	@echo "XYZ Portal - Available commands:"
	@echo ""
	@echo "  make install          Install dependencies"
	@echo "  make dev              Run development server (with watch)"
	@echo "  make start            Run production server"
	@echo "  make build            Build Docker image"
	@echo "  make push             Push Docker image to registry"
	@echo "  make deploy           Deploy with docker-compose"
	@echo "  make stop             Stop all containers"
	@echo "  make logs             Show container logs"
	@echo "  make shell            Open shell in container"
	@echo "  make clean            Clean up containers and images"
	@echo "  make test             Test app locally"
	@echo ""

# Development
install:
	npm install

dev:
	npm run dev

start:
	npm start

# Docker
build:
	docker build -t xyz-portal:latest .

push:
	@read -p "Enter Docker registry (e.g., docker.io/username): " registry; \
	docker tag xyz-portal:latest $$registry/xyz-portal:latest; \
	docker push $$registry/xyz-portal:latest

# Docker Compose
deploy:
	docker-compose up -d

stop:
	docker-compose down

logs:
	docker-compose logs -f xyz-portal

shell:
	docker-compose exec xyz-portal sh

# Cleanup
clean:
	docker-compose down --rmi all
	rm -rf node_modules
	rm -rf .npm

# Testing
test:
	@echo "Starting local server for testing..."
	@echo "Note: Auth will be disabled in test mode"
	@NODE_ENV=test npm start &
	@sleep 2
	@echo ""
	@echo "Testing API endpoints..."
	@curl -H "Remote-User: testuser" http://localhost:3000/api/apps
	@echo ""
	@echo "Press Ctrl+C to stop the server"

# Git helpers
commit-check:
	@echo "Files changed:"
	@git status --short
	@echo ""
	@echo "Ready to commit? (make commit MSG=\"your message\")"

commit:
	git add .
	git commit -m "$(MSG)"

push-git:
	git push origin main

# Full workflow
full-deploy: build deploy
	@echo "✅ Deployment complete!"
	@docker-compose ps

# Setup new VPS
vps-setup:
	@echo "Setting up on VPS..."
	mkdir -p /opt/xyz-portal
	cd /opt/xyz-portal && git clone <YOUR-REPO> .
	sudo cp nginxauth.conf /etc/nginx/sites-available/xyz
	sudo ln -s /etc/nginx/sites-available/xyz /etc/nginx/sites-enabled/
	sudo systemctl reload nginx
	make deploy

.DEFAULT_GOAL := help
