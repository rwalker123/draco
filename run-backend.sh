#!/bin/bash
# Backend runner script - ensures correct directory navigation

cd "$(dirname "$0")/draco-nodejs/backend" || exit 1

case "$1" in
  "start")
    npm start
    ;;
  "build")
    npm run build
    ;;
  "dev")
    npm run dev
    ;;
  "test")
    npm test
    ;;
  *)
    echo "Usage: $0 {start|build|dev|test}"
    echo "This script ensures you're in the correct directory before running npm commands"
    exit 1
    ;;
esac 