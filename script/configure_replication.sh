${DOCKER_COMMAND} down
${DOCKER_COMMAND} up -d postgres
${DOCKER_COMMAND} exec -u postgres postgres /docker-entrypoint-initdb.d/10-config.sh
${DOCKER_COMMAND} exec -u postgres postgres /docker-entrypoint-initdb.d/20-replication.sh
${DOCKER_COMMAND} down # postgres must be restarted for the changes to take effect

echo "configuration complete - run '${DOCKER_COMMAND} up -d' to start canvas"
