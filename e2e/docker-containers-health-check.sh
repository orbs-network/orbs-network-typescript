#!/bin/bash

# Look for unhealthy running docker containers. If found, sleep and retry. If not, immediately exit with 0.
# If retried till max_retries and still unhealthy, exit with 1.

check_docker()
{
    attempt=$1
    allowed_attempts=$2
    retry_interval=$3
    # Print number of containers that don't have a "healthy" designation on them
    result=$(docker ps | grep "orbs-test-node" | awk 'BEGIN { healthy=0; } match($0, /\(healthy\)/) { healthy++; } END { print NR-healthy }')

    if [[ result -gt 0 ]] ; then
        echo "Attempt #${attempt} of ${allowed_attempts}: Found ${result} containers not marked as healthy, will retry in ${retry_interval} seconds"
        return 1
    else
        echo "All containers are healthy"
    fi
    return 0
}

[[ $# -ne 2 ]] && { echo "Usage: $0 <max_retries> <interval_sec>"; exit 1; }

let i=1
max_retries=$1
retry_interval_sec=$2

while [[ $i -le $max_retries ]] ; do
    check_docker $i $max_retries $retry_interval_sec
    if [[ $? -eq 0 ]] ; then
        echo "All docker containers are healthy"
        exit 0
    fi
    [[ $i -lt $max_retries ]] && sleep ${retry_interval_sec}
    let i++
done
echo "Some Docker containers are still not healthy and timeout was reached"
exit 1
