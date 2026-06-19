import { ref } from 'vue'

type MessageHandler = (message: any) => void

export function useWebSocket(url: string) {
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)

  const connect = () => {
    ws.value = new WebSocket(url)

    ws.value.onopen = () => {
      connected.value = true
    }

    ws.value.onclose = () => {
      connected.value = false
    }

    return new Promise<void>((resolve, reject) => {
      if (!ws.value) return reject(new Error('ws client init failed'))
      ws.value.onopen = () => {
        connected.value = true
        resolve()
      }
      ws.value.onerror = (event) => reject(event)
    })
  }

  const send = (payload: any) => {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      throw new Error('websocket not connected')
    }
    ws.value.send(JSON.stringify(payload))
  }

  const onMessage = (handler: MessageHandler) => {
    if (!ws.value) return
    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handler(data)
      } catch {}
    }
  }

  const disconnect = () => {
    ws.value?.close()
    ws.value = null
    connected.value = false
  }

  return { ws, connected, connect, send, onMessage, disconnect }
}
