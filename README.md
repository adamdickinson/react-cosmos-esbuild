# React Cosmos ESbuild

ESbuild-compatible React Cosmos.

## Installation

```sh
npm install @adamdickinson/react-cosmos-esbuild
```

or

```sh
yarn add @adamdickinson/react-cosmos-esbuild
```

## Usage

If it's a simple enough build process, you can totally get away with just running:

```sh
yarn cosmos-esbuild
```

Doing so runs cosmos, as well as esbuild with a default, cosmos-compatible
config.

However, a lot of esbuild-driven projects have some rather complex
requirements, so this package accommodates that too. By specifying a
`esbuildConfigPath` in your cosmos config, you can inject your own esbuild
config in to adjust the esbuild config this package uses.

_Sample cosmos.config.json:_
```json
{
  "esbuildConfigPath": "./scripts/config.js"
}
```

_Sample config.js:_
```js
module.exports = {
  define: {
    'process.env.RUNNING_COSMOS', 'true'
  }
}
```

This config will then be used as the baseline config for the esbuild runner
that is used to power cosmos as follows:

```js
{
  ...config,
  bundle: true,
  entryPoints: [MAIN_TS_PATH],
  outfile: MAIN_JS_PATH,
  outdir: undefined
}
```

In other words, any custom config values for `bundle`, `entryPoints`, `outfile`
and `outdir` will be overridden in order for the package to work with cosmos.


### Got some things you'd like to see?

Spin up a PR! Standards are pretty high, but feedback is a cornerstone of any
good pull request so expect much love for any contributions.
