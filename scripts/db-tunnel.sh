#!/bin/sh
# Keep this terminal open while local PHP uses the server's lumingchan database.
exec ssh -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -L 127.0.0.1:13306:127.0.0.1:3306 "${LUMICHAN_SSH_USER:-root}@43.156.247.210"
