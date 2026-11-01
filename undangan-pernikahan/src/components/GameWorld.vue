<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import type Phaser from 'phaser'
import { bridge } from '../game/bridge'
const host = ref<HTMLElement>(), failed = ref(false)
let game: Phaser.Game | undefined, observer: ResizeObserver | undefined, disposed = false
function reload() { window.location.reload() }
onMounted(async () => {
  try {
    const [{ default: Phaser }, { BootScene }, { WorldScene }] = await Promise.all([import('phaser'), import('../game/BootScene'), import('../game/WorldScene')])
    if (disposed || !host.value) return
    game = new Phaser.Game({ type: Phaser.AUTO, parent: host.value, width: host.value.clientWidth, height: host.value.clientHeight, backgroundColor: '#739570', pixelArt: true, roundPixels: true, physics: { default: 'arcade', arcade: { debug: false } }, input: { activePointers: 3 }, audio: { noAudio: true }, scene: [BootScene, WorldScene] })
    game.canvas.tabIndex = 0; game.canvas.setAttribute('aria-label', 'Taman pernikahan. Gunakan panah atau WASD untuk berjalan, E untuk membuka objek terdekat.'); game.canvas.setAttribute('role', 'application')
    observer = new ResizeObserver(() => { if (host.value?.clientWidth && host.value.clientHeight) game?.scale.resize(host.value.clientWidth, host.value.clientHeight) }); observer.observe(host.value)
  } catch { failed.value = true; bridge.emit('ready', undefined) }
})
onBeforeUnmount(() => { disposed = true; observer?.disconnect(); game?.destroy(true) })
</script>
<template><div ref="host" class="game-host"/><div v-if="failed" class="engine-error"><h2>Taman belum bisa dimuat</h2><p>Coba muat ulang halaman atau gunakan browser lain yang mendukung canvas.</p><button class="primary" @click="reload">Coba lagi</button></div></template>
