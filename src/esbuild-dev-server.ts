import { Observable, Subscription } from 'rxjs'
import { first, filter, share } from 'rxjs/operators'
import { DevServerPluginArgs } from 'react-cosmos/dist/shared/devServer'
import { DomRendererConfig } from 'react-cosmos/dist/shared/rendererConfig'
import { build, BuildOptions, BuildResult } from 'esbuild'
import { generateUserDepsModule } from 'react-cosmos/dist/shared/userDeps'
import { join } from 'path'
import { writeFileSync } from 'fs'
import chalk from 'chalk'

const CONFIG_PATH = join(__dirname, 'config.ts')
const MAIN_JS_PATH = join(__dirname, 'main.js')
const MAIN_TS_PATH = join(__dirname, '../src/main.ts')

interface EsbuildEvent {
  type: 'rebuild' | 'started'
  error?: any
  result?: BuildResult | null
}

const fromEsbuild = (config: BuildOptions): Observable<EsbuildEvent> =>
  new Observable((observer) => {
    build({
      ...config,
      watch: { onRebuild: (error, result) => observer.next({ type: 'rebuild', error, result }) },
    })
      .then((result) => observer.next({ type: 'started', result }))
      .catch((error) => observer.next({ type: 'started', error }))
  })

type DevServerEsbuildPluginArgs = { cosmosConfig: { esbuildConfigPath?: string } } & DevServerPluginArgs

export function esbuildDevServer({ cosmosConfig, expressApp, sendMessage }: DevServerEsbuildPluginArgs) {
  const { experimentalRendererUrl } = cosmosConfig
  if (experimentalRendererUrl) return

  const { esbuildConfigPath, rootDir } = cosmosConfig
  const config = esbuildConfigPath ? require(join(rootDir, esbuildConfigPath)) : {}
  const subscriptions: Subscription[] = []

  // serve static directory
  // when invalidated, flag + send 'buildStart'
  // @NOTE: I don't think we have an 'invalidated' event to use

  // Generate all the data we need to build things
  const rendererConfig: DomRendererConfig = { containerQuerySelector: null }
  const depsModule = generateUserDepsModule({ cosmosConfig, rendererConfig, relativeToDir: null })
  writeFileSync(CONFIG_PATH, depsModule)
  console.log(chalk`{dim {magenta.bold [esbuild]} Cosmos deps file ready}`)

  const event$ = fromEsbuild({
    ...config,
    bundle: true,
    entryPoints: [MAIN_TS_PATH],
    outfile: MAIN_JS_PATH,
    outdir: undefined
  }).pipe(share())

  const start$ = event$.pipe(first(({ type }) => type === 'started'))
  subscriptions.push(
    start$.subscribe(() => {
      console.log(chalk`{dim {magenta.bold [esbuild]} Cosmos renderer file ready}`)
      console.log(chalk`{green.bold [esbuild]} Built`)
      expressApp.get('/main.js', (_, res) => res.sendFile(MAIN_JS_PATH))
      sendMessage({ type: 'buildDone' })
    })
  )

  // when failed, send 'buildError'
  const failure$ = event$.pipe(filter(({ error, type }) => type === 'rebuild' && !!error))
  subscriptions.push(failure$.subscribe(() => sendMessage({ type: 'buildError' })))

  // when compiled, send 'buildError' if errors or 'buildDone' if not
  const success$ = event$.pipe(filter(({ error, type }) => type === 'rebuild' && !error))
  subscriptions.push(
    success$.subscribe(() => {
      sendMessage({ type: 'buildStart' })
      console.log(chalk`{green.bold [esbuild]} Rebuilt`)
      sendMessage({ type: 'buildDone' })
    })
  )

  // serve files via express using webpack-dev-middleware
  // wait for first compile
  // @NOTE: may be able to skip this too
  expressApp.get('/_renderer.html', (_, res) => {
    res.send(
      '<!doctype html><html><head><meta charset="utf-8"><title>React Cosmos</title><meta name="viewport" content="width=device-width,initial-scale=1"><script defer="defer" src="./main.js"></script></head><body></body></html>'
    )
  })

  // return cleanup
  return () => {
    console.log(chalk`[{magenta.bold esbuild}] Tearing down...`)
    subscriptions.forEach((subscription) => subscription.unsubscribe())
  }
}
