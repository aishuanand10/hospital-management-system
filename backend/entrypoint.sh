#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
while ! python -c "
import socket, os
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(1)
try:
    s.connect((os.environ.get('POSTGRES_HOST', 'db'), int(os.environ.get('POSTGRES_PORT', 5432))))
    s.close()
    exit(0)
except Exception:
    exit(1)
" 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready."

python manage.py migrate --noinput
python manage.py seed_admin
python manage.py seed_demo
python manage.py seed_m2

exec "$@"
