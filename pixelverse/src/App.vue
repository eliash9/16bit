<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { Volume2, VolumeX, ArrowUpRight, Sparkles } from 'lucide-vue-next'
import { useAppStore } from './stores/app'
import { bridge } from './game/bridge'
const store = useAppStore()
function toggleMute() { store.muted = !store.muted; bridge.emit('mute', store.muted) }
</script>
<template>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <RouterLink class="brand" to="/" aria-label="PIXELVERSE home"><span class="brand-mark">P<span>✦</span></span><span>PIXELVERSE<small>DIGITAL AGENCY · EXTRA LIFE</small></span></RouterLink>
    <nav aria-label="Main navigation"><RouterLink to="/" exact-active-class="active">The world</RouterLink><RouterLink to="/agency">About us</RouterLink><RouterLink to="/portfolio">Our work</RouterLink><RouterLink to="/services">Services</RouterLink></nav>
    <div class="header-actions"><button class="icon-button" :aria-label="store.muted ? 'Enable interaction sounds' : 'Mute interaction sounds'" :aria-pressed="!store.muted" @click="toggleMute"><VolumeX v-if="store.muted" :size="18"/><Volume2 v-else :size="18"/></button><RouterLink to="/contact" class="button small">Let’s build <ArrowUpRight :size="16"/></RouterLink></div>
  </header>
  <main id="main"><RouterView /></main>
  <footer><span>© {{ new Date().getFullYear() }} PIXELVERSE <span class="footer-dim">· An independent creative guild.</span></span><span><Sparkles :size="13"/> Made of pixels. Built for people.</span><span class="demo-label">DEMO WORLD <i/> v1.0</span></footer>
</template>
