#!/bin/bash
export COMPOSE_FILE=./docker-compose.yml

${DOCKER_COMMAND} build
${DOCKER_COMMAND} up -d

# run unit tests
${DOCKER_COMMAND} exec -T module npm run test-cov
unit_status=$?
docker cp $(${DOCKER_COMMAND} ps -q module):/usr/src/app/coverage coverage

# check code formatting
${DOCKER_COMMAND} exec -T module npm run fmt:check
fmt_status=$?

# lint all the things
${DOCKER_COMMAND} exec -T module npm run lint
lint_status=$?

${DOCKER_COMMAND} stop

# jenkins uses the exit code to decide whether you passed or not
((unit_status)) && exit $unit_status
((lint_status)) && exit $lint_status
((fmt_status)) && exit $fmt_status
exit 0
