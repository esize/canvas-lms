#!/bin/bash

set -o errexit -o errtrace -o nounset -o pipefail -o xtrace

${DOCKER_COMMAND} build
${DOCKER_COMMAND} up -d

for service in cassandra:9160  dynamodb:8000 redis:6379; do
  ${DOCKER_COMMAND} exec -T canvas ./build/new-jenkins/wait-for-it ${service}
done

${DOCKER_COMMAND} exec -T postgres /bin/bash -c /wait-for-it
