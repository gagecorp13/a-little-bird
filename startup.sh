#!/bin/sh
# Optional Linux development entrypoint. npm run dev also works on Windows.
if curl --fail --silent http://127.0.0.1:8080/ >/dev/null; then exit 0; fi
nohup npm run dev > /tmp/alittlebird-dev.log 2>&1 &
