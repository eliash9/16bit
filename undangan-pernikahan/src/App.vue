<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BookOpen, Volume2, VolumeX, Compass, X, LockKeyhole, Check, ChevronRight, RotateCcw, Heart, HelpCircle } from 'lucide-vue-next'
import GameWorld from './components/GameWorld.vue'
import VirtualJoystick from './components/VirtualJoystick.vue'
import InvitationPanel from './components/InvitationPanel.vue'
import { stops, wedding, type StopId } from './data/wedding'
import { state, unlock } from './state'
import { bridge } from './game/bridge'
import { startMusic, stopMusic } from './audio'
const guest = new URLSearchParams(location.search).get('to')?.trim().slice(0, 100) || 'Tamu Istimewa'
const ready = ref(false), nearby = ref<StopId | null>(null), active = ref<StopId | null>(null), book = ref(false), help = ref(false), dialog = ref<HTMLElement>(), notice = ref('')
const modal = computed(() => Boolean(active.value || book.value || help.value))
const destination = computed(() => stops.find(s => s.id === nearby.value))
const canOpen = computed(() => ready.value && Boolean(nearby.value) && (nearby.value === 'welcome' || state.found.includes('welcome')))
const nextStop = computed(() => stops.find(s => !state.found.includes(s.id)))
const nearbyHint = computed(() => destination.value && !canOpen.value ? 'Buka surat di gerbang terlebih dahulu' : destination.value ? 'Kamu berada di dekat' : nextStop.value ? 'TUJUAN BERIKUTNYA' : 'SEMUA KENANGAN TERBUKA')
let previousFocus: HTMLElement | null = null
const cleanup: (() => void)[] = []
function close() { active.value = null; book.value = false; help.value = false }
function open(id: StopId) { unlock(id); book.value = false; active.value = id }
function interact() { if (canOpen.value) bridge.emit('interact', undefined) }
async function guide(id?: StopId) { close(); await nextTick(); if (id || nextStop.value) { bridge.emit('hint', id || nextStop.value!.id); notice.value = 'Ikuti karakter menuju penanda. Tekan tombol buka setelah tiba.' } }
async function toggleAudio() { if (!state.muted) { stopMusic(); state.muted = true; return } try { await startMusic(); state.muted = false; notice.value = '' } catch { notice.value = 'Audio belum tersedia di browser ini.' } }
function keydown(event: KeyboardEvent) {
  if (!modal.value) return
  if (event.key === 'Escape') { event.preventDefault(); close() }
  if (event.key === 'Tab') {
    const items = Array.from(dialog.value?.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]') || []).filter(el => !el.hasAttribute('disabled'))
    const first = items[0], last = items.at(-1)
    if (!first) return
    if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement as HTMLElement))) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement as HTMLElement))) { event.preventDefault(); first.focus() }
  }
}
watch(modal, async value => { bridge.emit('pause', value || document.hidden); if (value) { previousFocus = document.activeElement as HTMLElement; await nextTick(); dialog.value?.querySelector<HTMLElement>('h2, button')?.focus() } else { await nextTick(); previousFocus?.isConnected && previousFocus.focus({ preventScroll: true }) } })
function visibility() { bridge.emit('pause', document.hidden || modal.value); if (document.hidden) stopMusic(); else if (!state.muted) void startMusic().catch(() => { state.muted = true }) }
onMounted(() => {
  cleanup.push(bridge.on('ready', () => { ready.value = true; bridge.emit('pause', modal.value || document.hidden) }), bridge.on('nearby', id => { nearby.value = id; notice.value = '' }), bridge.on('enter', id => { if (id === 'welcome' || state.found.includes('welcome')) open(id) }))
  document.addEventListener('keydown', keydown); document.addEventListener('visibilitychange', visibility)
})
onBeforeUnmount(() => { cleanup.forEach(fn => fn()); document.removeEventListener('keydown', keydown); document.removeEventListener('visibilitychange', visibility); stopMusic() })
</script>
<template>
  <div class="app-shell">
    <div class="desktop-intro"><a class="wordmark" href="./"><span class="brand-pixel">♥</span> JANJI SEPIXEL<span class="edition">THE WEDDING EDITION</span></a><div class="desktop-title"><span class="eyebrow">A LITTLE WORLD. A LIFETIME OF LOVE.</span><h1>Dua hati.<br>Satu <em>petualangan.</em></h1><p>Ada cerita yang ditulis dengan kata.<br>Cerita kami dimulai dengan langkah kecilmu.</p><div class="desktop-names">{{ wedding.bride.short }} <i>&</i> {{ wedding.groom.short }}</div><span class="desktop-date">{{ wedding.date.split('-').reverse().join('.') }} · {{ wedding.address.split(',')[0]?.toUpperCase() }}</span></div><div class="desktop-instructions"><span class="eyebrow">CARA MENJELAJAH</span><p><kbd>W A S D</kbd> / <kbd>↑ ← ↓ →</kbd> untuk berjalan</p><p><kbd>E</kbd> untuk membuka undangan terdekat</p><p>Atau klik jalan dan gunakan tombol buka.</p></div><div class="desktop-footer">DIBUAT DARI PIXEL, DIRAYAKAN DENGAN HATI. <Heart :size="13"/></div></div>
    <main class="game-device" :inert="modal || undefined">
      <GameWorld/>
      <div class="game-vignette" aria-hidden="true"/>
      <header class="game-header"><div class="game-brand"><span class="tiny-heart">♥</span><div>JANJI SEPIXEL<small>THE WEDDING ADVENTURE</small></div></div><div class="header-buttons"><button class="glass-button" @click="toggleAudio" :aria-label="state.muted ? 'Nyalakan musik' : 'Matikan musik'" :aria-pressed="!state.muted"><VolumeX v-if="state.muted" :size="18"/><Volume2 v-else :size="18"/></button><button class="glass-button" @click="help = true" aria-label="Cara bermain"><HelpCircle :size="18"/></button></div></header>
      <div class="chapter-tag"><span class="chapter-dot"/> CHAPTER 01 <span class="tag-line"/> THE BEGINNING OF FOREVER</div>
      <div class="world-title"><span>YOU'RE INVITED TO THE WEDDING OF</span><h1>{{ wedding.bride.short }} <i>&</i> {{ wedding.groom.short }}</h1><p>{{ wedding.dateLabel }}</p></div>
      <div class="world-side"><span class="compass-letter">N</span><Compass :size="24" :stroke-width="1"/><button class="glass-button" @click="bridge.emit('home', undefined)" aria-label="Kembali ke gerbang"><RotateCcw :size="16"/></button></div>
      <div v-if="!ready" class="loading-screen" role="status"><span class="loading-heart">♥</span><h2>Menyiapkan hari bahagia…</h2><p>Sedikit pixel, banyak cinta.</p><div class="loading-track"><span/></div></div>
      <div class="game-bottom">
        <div class="quest-card"><div class="quest-icon">{{ destination?.icon || nextStop?.icon || '♥' }}</div><div><span>{{ nearbyHint }}</span><strong>{{ destination?.name || nextStop?.name || 'Terima kasih sudah menjelajah' }}</strong></div><button @click="guide()" aria-label="Pandu menuju tujuan berikutnya" :disabled="!ready || !nextStop"><Compass :size="19"/></button></div>
        <div class="controls-row"><div class="joystick-wrap"><VirtualJoystick/><span>GERAKKAN KARAKTER</span></div><div class="interact-wrap"><button class="interact-button" :class="{ available: canOpen }" :disabled="!canOpen" @click="interact" aria-label="Buka objek terdekat"><span>{{ canOpen ? destination?.icon : '✦' }}</span><small>{{ canOpen ? 'BUKA' : 'DEKATI' }}</small></button><span>{{ canOpen ? destination?.action : 'OBJEK UNDANGAN' }}</span></div></div>
        <div class="bottom-bar"><button class="book-button" @click="book = true"><BookOpen :size="17"/><span>Buku Undangan</span><span class="book-count">{{ state.found.length }}/7</span></button><div class="world-status"><span/> LOVE IS IN THE AIR</div></div>
      </div>
      <div class="guest-pill">UNTUK <strong>{{ guest }}</strong><Heart :size="11"/></div>
      <div class="sr-only" aria-live="polite">{{ notice || (destination ? `Dekat ${destination.name}. ${canOpen ? destination.action : 'Buka surat pertama dahulu.'}` : '') }}</div>
    </main>
    <aside class="desktop-note"><span class="note-spark">✦</span><p>Sebuah undangan.<br>Petualangan kecil.<br><em>Kenangan selamanya.</em></p><div class="note-line"/><span class="eyebrow">SCROLL LESS.<br>EXPLORE MORE.</span></aside>
    <div v-if="modal" class="modal-backdrop" @click.self="close"><section ref="dialog" class="invitation-sheet" role="dialog" aria-modal="true" :aria-label="active ? stops.find(s => s.id === active)?.name : book ? 'Buku Undangan' : 'Cara bermain'">
      <InvitationPanel v-if="active" :key="active" :id="active" :guest="guest" @close="close"/>
      <template v-else-if="book"><div class="sheet-header"><span class="eyebrow">✦ YOUR LOVE QUEST</span><button class="round-button" @click="close" aria-label="Tutup buku"><X :size="20"/></button></div><div class="sheet-body"><h2 tabindex="-1">Buku Undangan</h2><p>Setiap langkah membuka cerita. Baca kembali halaman yang sudah kamu temukan.</p><div class="book-progress"><span>{{ state.found.length }} dari 7 kenangan ditemukan</span><div><i :style="{ width: `${state.found.length / 7 * 100}%` }"/></div></div><div class="book-list"><button v-for="(stop, i) in stops" :key="stop.id" :disabled="!state.found.includes(stop.id)" @click="active = stop.id; book = false"><span class="stop-number">0{{ i + 1 }}</span><span class="stop-text"><strong>{{ stop.name }}</strong><small>{{ state.found.includes(stop.id) ? stop.subtitle : 'Temukan di taman untuk membuka' }}</small></span><Check v-if="state.found.includes(stop.id)" :size="17"/><LockKeyhole v-else :size="16"/><ChevronRight v-if="state.found.includes(stop.id)" :size="16"/></button></div><button v-if="nextStop" class="primary full" @click="guide()"><Compass :size="17"/> Pandu ke halaman berikutnya</button><div v-else class="soft-note center">Semua halaman telah terbuka. Sampai bertemu di hari bahagia kami! ♥</div></div></template>
      <template v-else><div class="sheet-header"><span class="eyebrow">PLAYER'S GUIDE</span><button class="round-button" @click="close" aria-label="Tutup petunjuk"><X :size="20"/></button></div><div class="sheet-body"><h2 tabindex="-1">Langkah kecilmu,<br>cerita bahagia kami.</h2><div class="help-step"><b>01</b><div><h3>Jelajahi taman</h3><p>Geser joystick atau ketuk jalan untuk menggerakkan karakter. Di komputer, gunakan WASD atau tombol panah.</p></div></div><div class="help-step"><b>02</b><div><h3>Dekati penanda</h3><p>Mulai dari amplop di depanmu. Tombol BUKA akan menyala ketika karakter cukup dekat. Tekan tombol itu atau E untuk membaca.</p></div></div><div class="help-step"><b>03</b><div><h3>Kumpulkan cerita</h3><p>Temukan mempelai, jadwal, lokasi, dan buku tamu. Baca ulang penemuanmu di Buku Undangan. Tombol kompas membantumu berjalan menuju tujuan berikutnya.</p></div></div><button class="primary full" @click="close">Siap berpetualang <span>→</span></button><p class="fine-print">Prototipe undangan. Data pasangan dan acara masih berupa contoh.</p></div></template>
    </section></div>
  </div>
</template>
