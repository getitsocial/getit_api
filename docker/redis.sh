#!/bin/bash
REDIS_CONTAINER_NAME="redis"
REDIS="redis:5.0.8"

docker run --rm --detach \
    --name ${REDIS_CONTAINER_NAME} \
    -p 6379:6379 \
    ${REDIS}