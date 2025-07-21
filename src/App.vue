<template>
    <div>
        <video
            ref="remoteVideo"
            autoplay
            playsinline
        />
        <!-- <div v-else class="video-wrapper">
            <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/nYcHi9EgUHs?autoplay=1&mute=0&loop=1&playlist=nYcHi9EgUHs"
                title="YouTube video player"
                frameborder="0"
                allowfullscreen
            ></iframe>
        </div> -->
    </div>
    <div style="position: fixed; bottom: 10px; right: 10px; color: white; background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px; font-family: monospace;">
      Your ID: {{ myId }}
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { startSignaling } from './signaling.client.js'

const connected = ref(false)
const remoteVideo = ref(null)
const myId = ref('')

onMounted(async () => {
  const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

  startSignaling(localStream, (remoteStream, id) => {
    remoteVideo.value.srcObject = remoteStream
    connected.value = true
  }, (id) => {
    myId.value = id
  })
})
</script>

<style>
.video-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
</style>