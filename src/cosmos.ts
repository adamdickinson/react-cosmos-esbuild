#!/usr/bin/env node
import { startWebServer } from './server'

// Set the env before any code reads it
process.env['NODE_ENV'] = process.env['NODE_ENV'] || 'development'
require('regenerator-runtime/runtime')

startWebServer().catch((err: Error) => {
  console.log('[Cosmos] Server crashed...')
  console.log(`\n  (╯°□°)╯︵ ┻━┻\n`)
  console.log(err)
  process.exit(1)
})
