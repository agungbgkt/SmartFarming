#!/bin/sh
set -e
export PORT="${PORT:-10000}"
php artisan migrate --force
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf