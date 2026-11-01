<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Maximize, Minimize, LocateFixed, ArrowRight, LoaderCircle } from 'lucide-vue-next'
import VirtualJoystick from './VirtualJoystick.vue'
import { bridge, type LocationId } from '../game/bridge'
import { locations } from '../data/locations'
import { useAppStore, save } from '../stores/app'
import type Phaser from 'phaser'
const host = ref<HTMLDivElement>()
const frame = ref<HTMLDivElement>()
const ready = ref(false), failed = ref(false), nearby = ref<LocationId | null>(null), fullscreen = ref(false)
const fullscreenSupported = typeof document !== 'undefined' && document.fullscreenEnabled
const store = useAppStore(), router = useRouter()
const destination = computed(() => locations.find(location => location.id === nearby.value))
let game: Phaser.Game | undefined
let observer: ResizeObserver | undefined
let disposed = false
let cleanups: (() => void)[] = []
function interact() { bridge.emit('interact', undefined) }
function home() { bridge.emit('home', undefined); host.value?.querySelector('canvas')?.focus() }
async function toggleFullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await frame.value?.requestFullscreen() } catch { /* Fullscreen is optional on mobile Safari. */ }
}
onMounted(async () => {
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  const motion = () => bridge.emit('reducedMotion', media.matches)
  const visibility = () => bridge.emit('pause', document.hidden)
  const fullscreenChange = () => { fullscreen.value = Boolean(document.fullscreenElement) }
  const preventScroll = (event: KeyboardEvent) => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key) && document.activeElement === game?.canvas) event.preventDefault() }
  media.addEventListener('change', motion)
  document.addEventListener('visibilitychange', visibility)
  document.addEventListener('fullscreenchange', fullscreenChange)
  window.addEventListener('keydown', preventScroll)
  cleanups = [
    () => media.removeEventListener('change', motion),
    () => document.removeEventListener('visibilitychange', visibility),
    () => document.removeEventListener('fullscreenchange', fullscreenChange),
    () => window.removeEventListener('keydown', preventScroll),
    bridge.on('ready', () => { ready.value = true; motion(); bridge.emit('mute', store.muted); visibility() }),
    bridge.on('nearby', id => { nearby.value = id }),
    bridge.on('position', point => { store.lastPosition = point; save('pixelverse:position', JSON.stringify(point)) }),
    bridge.on('enter', id => { store.visit(id); void router.push(`/${id}`) }),
  ]
  try {
    const [{ default: Phaser }, { BootScene }, { WorldScene }] = await Promise.all([import('phaser'), import('../game/BootScene'), import('../game/WorldScene')])
    if (disposed || !host.value) return
    const box = host.value.getBoundingClientRect()
    game = new Phaser.Game({
      type: Phaser.AUTO, parent: host.value, width: Math.round(box.width), height: Math.round(box.height),
      backgroundColor: '#6b9560', pixelArt: true, roundPixels: true,
      // Fixed logical pixels avoid multiplying mobile GPU cost by devicePixelRatio.
      render: { antialias: false, pixelArt: true, roundPixels: true },
      physics: { default: 'arcade', arcade: { debug: false } },
      input: { activePointers: 3, keyboard: true },
      scene: [BootScene, WorldScene],
      callbacks: { preBoot: instance => instance.registry.set('position', store.lastPosition) },
      audio: { noAudio: true },
    })
    game.canvas.tabIndex = 0
    game.canvas.setAttribute('aria-label', 'PIXELVERSE town. Use WASD or arrow keys to walk, E to enter nearby locations. Tab to leave the game.')
    game.canvas.setAttribute('role', 'application')
    observer = new ResizeObserver(entries => {
      const size = entries[0]?.contentRect
      if (size && size.width > 0 && size.height > 0) game?.scale.resize(Math.round(size.width), Math.round(size.height))
    })
    observer.observe(host.value)
  } catch { failed.value = true }
})
onBeforeUnmount(() => {
  disposed = true
  observer?.disconnect()
  bridge.emit('snapshot', undefined)
  game?.destroy(true)
  cleanups.forEach(cleanup => cleanup())
})
</script>
<template>
  <div ref="frame" class="game-frame">
    <div ref="host" class="game-canvas" :class="{ hidden: failed }"/>
    <div v-if="!ready && !failed" class="game-loading"><LoaderCircle :size="28"/><span>BUILDING YOUR LITTLE WORLD…</span></div>
    <div v-if="failed" class="game-fallback"><span>✦</span><h2>The adventure continues.</h2><p>Your browser couldn’t start the town. Every location is still one click away in the navigation below.</p></div>
    <template v-if="ready && !failed">
      <div class="game-badge"><span>✦</span><div>THE CREATIVE COMMONS<small>LVL. 01 · EXPLORER</small></div></div>
      <div class="map-controls"><button class="map-button" @click="home" aria-label="Return player to town square"><LocateFixed :size="18"/></button><button v-if="fullscreenSupported" class="map-button" @click="toggleFullscreen" :aria-label="fullscreen ? 'Exit fullscreen' : 'Fullscreen town'"><Minimize v-if="fullscreen" :size="18"/><Maximize v-else :size="18"/></button></div>
      <span class="map-compass" aria-hidden="true">N<br/><span>✥</span></span>
      <VirtualJoystick />
      <div class="interaction" aria-live="polite"><button v-if="destination" class="enter-button" @click="interact"><kbd>E</kbd> Enter {{ destination.name }} <ArrowRight :size="15"/></button><span v-else class="walk-hint">Meet us at a landmark <span>✦</span></span></div>
      <div class="player-caption">YOU ARE THE MAIN CHARACTER <span>♥ ♥ ♥</span></div>
    </template>
  </div>
</template>
