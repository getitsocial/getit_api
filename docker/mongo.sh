#!/bin/bash
CONTAINER_NAME="mongo"
MONGO_DB="mongo:4.2.5"

docker run --rm --detach \
    --name ${CONTAINER_NAME} \
    -p 27017:27017 \
    ${MONGO_DB}