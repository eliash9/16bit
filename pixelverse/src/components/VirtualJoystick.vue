<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { bridge } from '../game/bridge'
const base = ref<HTMLDivElement>()
const offset = ref({ x: 0, y: 0 })
let activePointer: number | null = null
function move(event: PointerEvent) {
  if (activePointer !== event.pointerId || !base.value) return
  const box = base.value.getBoundingClientRect()
  const x = event.clientX - box.left - box.width / 2, y = event.clientY - box.top - box.height / 2
  const distance = Math.hypot(x, y), factor = distance > 31 ? 31 / distance : 1
  offset.value = { x: x * factor, y: y * factor }
  bridge.emit('move', { x: offset.value.x / 31, y: offset.value.y / 31 })
}
function start(event: PointerEvent) { if (activePointer !== null) return; activePointer = event.pointerId; base.value?.setPointerCapture(event.pointerId); move(event) }
function stop() { activePointer = null; offset.value = { x: 0, y: 0 }; bridge.emit('move', offset.value) }
onBeforeUnmount(stop)
</script>
<template><div ref="base" class="joystick" aria-hidden="true" @pointerdown.prevent="start" @pointermove.prevent="move" @pointerup="stop" @pointercancel="stop" @lostpointercapture="stop"><span class="joystick-cross">✛</span><span class="joystick-knob" :style="{ transform: `translate(${offset.x}px, ${offset.y}px)` }"/></div></template>
