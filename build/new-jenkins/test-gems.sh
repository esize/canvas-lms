#!/bin/bash

set -x -o errexit -o errtrace -o nounset -o pipefail

${DOCKER_COMMAND} exec -T canvas ./gems/test_all_gems.sh
