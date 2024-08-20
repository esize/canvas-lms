#!/bin/bash

set -x -o errexit -o errtrace -o nounset -o pipefail

${DOCKER_COMMAND} exec -T canvas bundle exec rspec --options spec/spec.opts --tag xbrowser spec/selenium/
