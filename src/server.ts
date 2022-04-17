import { httpProxy } from 'react-cosmos/dist/plugins/httpProxy'
import { openFile } from 'react-cosmos/dist/plugins/openFile'
import { userDepsFile } from 'react-cosmos/dist/plugins/userDepsFile'
import { startDevServer } from 'react-cosmos/dist/devServer/startDevServer'
import { esbuildDevServer } from './esbuild-dev-server'

export async function startWebServer() {
  await startDevServer('web', [openFile, esbuildDevServer, httpProxy, userDepsFile])
}

