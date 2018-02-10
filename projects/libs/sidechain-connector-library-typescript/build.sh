#!/bin/bash -e

yatn link ../common-library-typescript

yatn install
yatn run build

yatn test
