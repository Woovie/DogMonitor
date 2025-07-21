export function startSignaling(localStream, onRemoteStream, onId) {
    const socket = new WebSocket(`wss://${location.host}/ws`)
    const peers = new Map()

    socket.onmessage = async (event) => {
        const msg = JSON.parse(event.data)

        if (msg.type === "welcome") {
            onId && onId(msg.id)
        }

        if (msg.type === "peer-joined") {
            const peerId = msg.id
            createPeerConnection(peerId, true)
        }

        if (msg.type === "peer-left") {
            peers.delete(msg.id)
        }

        if (msg.type === "offer") {
            const peerId = msg.from
            createPeerConnection(peerId, false)
            await peers.get(peerId).conn.setRemoteDescription(new RTCSessionDescription(msg.payload))
            const answer = await peers.get(peerId).conn.createAnswer()
            await peers.get(peerId).conn.setLocalDescription(answer)
            send(peerId, "answer", answer)
        }

        if (msg.type === "answer") {
            const peerId = msg.from
            await peers.get(peerId).conn.setRemoteDescription(new RTCSessionDescription(msg.payload))
        }

        if (msg.type === "candidate") {
            const peerId = msg.from
            const candidate = new RTCIceCandidate(msg.payload)
            await peers.get(peerId).conn.addIceCandidate(candidate)
        }
    }

    function send(peerId, type, payload) {
        socket.send(JSON.stringify({ to: peerId, type, payload }))
    }

    function createPeerConnection(peerId, initiator) {
        if (peers.has(peerId)) return

        const conn = new RTCPeerConnection({
            iceServers: [
                {
                    urls: `stun:${location.hostname}:3478`
                },
                {
                    urls: `turn:${location.hostname}:3478`,
                    credential: 'catching0TRAITOR0dating.sniffs', // This is a non-real secret. It's just to keep anon users out.
                    username: 're5w3wer34wetr'
                }
            ]
        })

        conn.onicecandidate = (e) => {
            if (e.candidate) send(peerId, "candidate", e.candidate)
        }

        conn.ontrack = (e) => {
            onRemoteStream(e.streams[0])
        }

        localStream.getTracks().forEach(track => {
            conn.addTrack(track, localStream)
        })

        peers.set(peerId, { conn })

        if (initiator) {
            conn.createOffer()
                .then(offer => conn.setLocalDescription(offer))
                .then(() => send(peerId, "offer", conn.localDescription))
        }
    }
}
