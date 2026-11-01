<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowUpRight, Compass, Keyboard, MousePointer2, Map, ChevronRight, CircleHelp, X } from 'lucide-vue-next'
import { locations } from '../data/locations'
import { useAppStore } from '../stores/app'
const GameWorld = defineAsyncComponent(() => import('../components/GameWorld.vue'))
const store = useAppStore()
const help = ref(false)
</script>
<template>
  <div class="town-page">
    <section class="intro"><div><p class="eyebrow"><span/> SMALL TEAM. BIG ADVENTURES.</p><h1>Your next big idea<br class="mobile-break"/> starts <em>here.</em><span class="heading-star">✳</span></h1><p>We’re a digital agency with a little more character. Come explore our world.</p></div><div class="availability"><span class="status-dot"/> Open for new adventures<small>YOUR NEXT CHAPTER, TOGETHER.</small></div></section>
    <div class="adventure-layout">
      <section class="world-panel" aria-label="Interactive agency town">
        <div class="world-toolbar"><span><span class="live-dot"/> PIXELVERSE TOWN <span class="toolbar-divider">/</span><span class="muted">THE OVERWORLD</span></span><button class="text-button" @click="help = !help" :aria-expanded="help"><CircleHelp :size="15"/> How to play</button></div>
        <GameWorld />
        <div class="world-bottom"><span><span class="status-dot"/> A little exploration goes a long way.</span><span><Keyboard :size="14"/> WASD / ARROWS <span class="toolbar-divider">·</span><MousePointer2 :size="13"/> CLICK TO MOVE</span></div>
      </section>
      <aside class="explorer-panel"><div class="panel-label"><Compass :size="16"/> YOUR ADVENTURE</div><h2>A world of<br/>possibilities.</h2><p>Good things start with curiosity.<br/>Where will you go first?</p><div class="destination-list"><RouterLink v-for="(location, index) in locations" :key="location.id" :to="`/${location.id}`"><span class="destination-icon" :style="{ color: location.color }">{{ location.icon }}</span><span><small>0{{ index + 1 }} / {{ location.id === 'agency' ? 'GET TO KNOW US' : location.id === 'portfolio' ? 'SEE WHAT WE DO' : location.id === 'services' ? 'LEVEL UP YOUR BRAND' : 'SAY HELLO' }}</small><strong>{{ location.name }}</strong></span><ChevronRight :size="15"/></RouterLink></div><div class="explore-progress"><span>Places discovered <strong>{{ store.visited.length }} / 4</strong></span><div><i :style="{ width: `${store.visited.length * 25}%` }"/></div></div><div class="explorer-note"><Map :size="17"/><span>No wrong turns here.<br/><strong>Just new possibilities.</strong></span></div></aside>
    </div>
    <section class="quick-section" aria-label="Quick navigation"><div class="quick-heading"><h2>Choose your own adventure<span>Or skip the walking. We get it.</span></h2><span class="eyebrow">FOUR STOPS. ONE CREATIVE WORLD.</span></div><div class="quick-grid"><RouterLink v-for="location in locations" :key="location.id" :to="`/${location.id}`" :style="{ '--accent': location.color }"><span class="quick-icon">{{ location.icon }}</span><div><h3>{{ location.short }}</h3><p>{{ location.subtitle }}</p></div><ArrowUpRight :size="18"/></RouterLink></div></section>
    <section v-if="help" class="help-dialog" aria-labelledby="help-title"><button class="icon-button close-button" @click="help = false" aria-label="Close instructions"><X :size="20"/></button><p class="eyebrow">WELCOME, EXPLORER</p><h2 id="help-title">A tiny world. All yours.</h2><p>Focus the town, then use <kbd>W A S D</kbd> or the arrow keys to walk. Click or tap the ground to find a path. On touchscreens, use the joystick.</p><p>Walk to a building’s entrance and press <kbd>E</kbd> or use the enter button. Every location is also available through the navigation links.</p></section>
  </div>
</template>
