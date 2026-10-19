#!/bin/sh
set -e
cd "$(dirname "$0")/../../docker/mosquitto/config"

MUID=$(docker run --rm --entrypoint id eclipse-mosquitto:2.1.2 -u mosquitto)
MGID=$(docker run --rm --entrypoint id eclipse-mosquitto:2.1.2 -g mosquitto)

sudo chown "$MUID:$MGID" passwd.conf acl.conf
sudo chmod 0700 passwd.conf acl.conf
ls -ln passwd.conf acl.conf