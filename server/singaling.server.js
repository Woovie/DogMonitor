const clients = new Map()

Bun.serve({
  port: 3000,
  fetch(req, server) {
    if (server.upgrade(req)) return;
    return new Response("Expected WebSocket", { status: 400 });
  },
  websocket: {
    open(ws) {
      const id = crypto.randomUUID()
      ws.data = { id }
      clients.set(id, ws)

      ws.send(JSON.stringify({ type: "welcome", id }))

      // Announce new client to others
      for (const [otherId, client] of clients.entries()) {
        if (otherId !== id) {
          client.send(JSON.stringify({ type: "peer-joined", id }))
          ws.send(JSON.stringify({ type: "peer-joined", id: otherId }))
        }
      }

      console.log("Client connected:", id)
    },

    message(ws, message) {
      let data
      try {
        data = JSON.parse(message)
      } catch {
        console.error("Invalid JSON:", message)
        return
      }

      const { to, type, payload } = data
      const from = ws.data.id

      if (!to || !clients.has(to)) {
        console.warn("No such client:", to)
        return
      }

      clients.get(to).send(JSON.stringify({ from, type, payload }))
    },

    close(ws) {
      const id = ws.data?.id
      clients.delete(id)

      for (const client of clients.values()) {
        client.send(JSON.stringify({ type: "peer-left", id }))
      }

      console.log("Client disconnected:", id)
    }
  }
})

console.log("Signaling server running on ws://${location.host}")
