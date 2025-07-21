const clients = new Map()

Bun.serve({
  port: 3000,
  async fetch(req, server) {
    const { pathname } = new URL(req.url)

    // Handle WebSocket upgrade
    if (pathname === "/ws" && server.upgrade(req)) return;

    // Static file serving
    const filePath = `./dist${pathname === "/" ? "/index.html" : pathname}`
    try {
      return new Response(Bun.file(filePath))
    } catch {
      return new Response("Not found", { status: 404 })
    }
  },

  websocket: {
    open(ws) {
      const id = crypto.randomUUID()
      ws.data = { id }
      clients.set(id, ws)

      ws.send(JSON.stringify({ type: "welcome", id }))

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
      const peer = clients.get(to)
      if (!peer) return
      peer.send(JSON.stringify({ from, type, payload }))
    },

    close(ws) {
      const id = ws.data?.id
      if (!id) return
      clients.delete(id)

      for (const client of clients.values()) {
        client.send(JSON.stringify({ type: "peer-left", id }))
      }

      console.log("Client disconnected:", id)
    }
  }
})

console.log("🔥 Server running at http://localhost:3000")
