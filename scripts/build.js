#!/usr/bin/env node

const { DateTime } = require('luxon')
const chalk = require('chalk')
const fs = require('node:fs/promises')
const { join } = require('node:path')

const watching = process.argv.includes('--watch')

const getStatusColor = (status) => {
  if (status < 300) return 'green'
  if (status < 400) return 'yellow'
  return 'red'
}
const getReponseTimeColor = (time) => {
  if (time < 30) return 'green'
  if (time < 80) return 'yellow'
  return 'red'
}

const formatNow = () => {
  const time = DateTime.now().toISO()
  return chalk.grey.bold`[${time}]`
}

const formatResponseTime = (time) => {
  const color = getReponseTimeColor(time)
  const formattedTime = `${time}ms`.padEnd(6)
  return chalk[color].bold`${formattedTime}`
}

const formatStatus = (status) => {
  const color = getStatusColor(status)
  return chalk[color].bold`${status}`
}

const forwardRequest = (to, host, port, method, headers, originalRequest, originalResponse) => {
  const forwardedRequest = http.request({ hostname: host, port, method, headers, path: to }, (forwardedResponse) => {
    if (forwardedResponse.statusCode === 404)
      return forwardRequest('/', host, port, method, headers, originalRequest, originalResponse)
    originalResponse.writeHead(forwardedResponse.statusCode, forwardedResponse.headers)
    forwardedResponse.pipe(originalResponse, { end: true })
  })

  originalRequest.pipe(forwardedRequest, { end: true })
}

const onBuild = () => console.log(chalk.cyan.bold`[esbuild]` + ' Rebuilt')

const onError = (error) => console.log(chalk.red.bold`[esbuild]` + ' Error encountered: ' + error)

const onFulfill = () => console.log(chalk.cyan.bold`[esbuild]` + (watching ? ' Built, and watching' : ' Built'))

const onReject = (reason) => console.log(chalk.red.bold`Server unable to start: '${reason}'`)

const onRequest = ({ method, path, remoteAddress, status, timeInMS }) =>
  console.log(
    `${formatNow()}  ${formatResponseTime(timeInMS)} ${remoteAddress} "${method} ${path}" ${formatStatus(status)}`
  )

require('esbuild')
  .build(
    {
      bundle: true,
      external: [
        'esbuild',
        'fs',
        'path',
        'react',
        'react-cosmos',
        'react-cosmos-playground2',
        'uws',
      ],
      entryPoints: ['./src/cosmos.ts', './src/server.ts'],
      outdir: 'dist',
      watch: watching ? {
        onRebuild(error, result) {
          if (error) onError(error)
          else onBuild()
        }
      } : undefined,
      platform: 'node'
    }
  )
  .then(() => {
    return fs.copyFile('src/react-shim.js', 'dist/react-shim.js')
  })
  .then(onFulfill)
  .catch(onReject)
