import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Point } from '../game/bridge'
function read(key: string) { try { return localStorage.getItem(key) } catch { return null } }
export function save(key: string, value: string) { try { localStorage.setItem(key, value) } catch { /* Storage may be disabled. */ } }
export const useAppStore = defineStore('app', () => {
  const muted = ref(read('pixelverse:muted') !== 'false')
  const visited = ref<string[]>([])
  let position: Point = { x: 512, y: 400 }
  try { const saved = JSON.parse(read('pixelverse:position') || 'null'); if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) position = saved } catch { /* Ignore malformed data. */ }
  const lastPosition = ref(position)
  watch(muted, value => save('pixelverse:muted', String(value)))
  function visit(id: string) { if (!visited.value.includes(id)) visited.value.push(id) }
  return { muted, visited, lastPosition, visit }
})
