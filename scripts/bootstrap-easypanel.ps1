# Bootstrap EasyPanel: apply migrations + seed users (manual, safe)
# Usage (inside api container or local repo root):
#   .\scripts\bootstrap-easypanel.ps1

$ErrorActionPreference = "Stop"

Write-Host "==> Running Prisma migrate deploy" -ForegroundColor Cyan
npm run migrate:deploy --workspace=apps/api

Write-Host "==> Running Prisma seed" -ForegroundColor Cyan
npm run seed --workspace=apps/api

Write-Host "✅ Bootstrap completed" -ForegroundColor Green
