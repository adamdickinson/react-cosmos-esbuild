import 'regenerator-runtime/runtime'

import { Message } from 'react-cosmos-shared2/util'
import { SERVER_MESSAGE_EVENT_NAME } from 'react-cosmos-shared2/build'
import { mountDomRenderer } from 'react-cosmos/dist/dom'
import io from 'socket.io-client'

mount()

const socket = io()
socket.on(SERVER_MESSAGE_EVENT_NAME, onServerMessage)

function mount() {
  const { rendererConfig, fixtures, decorators } = require('../dist/config')
  mountDomRenderer({
    rendererConfig,
    fixtures,
    decorators,
  })
}

function onServerMessage({ type }: Message) {
  if (type === 'buildDone') {
    window.location.reload()
  }
}
