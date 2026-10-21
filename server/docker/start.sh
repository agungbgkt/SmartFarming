#!/bin/sh
set -e
export PORT="${PORT:-10000}"

rm -f /etc/nginx/sites-enabled/default
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/app.conf

php artisan migrate --force
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf