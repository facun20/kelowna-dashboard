#!/bin/sh
# Start the cron scheduler in the background
node cron.mjs &

# Start Next.js (foreground — Docker needs a foreground process)
exec node node_modules/next/dist/bin/next start -p 3000
