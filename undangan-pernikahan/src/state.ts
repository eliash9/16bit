import { reactive, watch } from 'vue'
import { stops, type StopId } from './data/wedding'
import type { Point } from './game/bridge'
function read(key: string) { try { return localStorage.getItem(`janji-sepixel:${key}`) } catch { return null } }
export function save(key: string, data: unknown) { try { localStorage.setItem(`janji-sepixel:${key}`, JSON.stringify(data)) } catch { /* Browsing without storage remains playable. */ } }
function parse(key: string) { try { return JSON.parse(read(key) || 'null') } catch { return null } }
const found = parse('found'), position = parse('position')
export const state = reactive({ found: (Array.isArray(found) ? found.filter((id: unknown) => stops.some(s => s.id === id)) : []) as StopId[], position: (position && Number.isFinite(position.x) && Number.isFinite(position.y) ? position : { x: 400, y: 1180 }) as Point, muted: true })
watch(() => state.found.slice(), value => save('found', value))
export function unlock(id: StopId) { if (!state.found.includes(id)) state.found.push(id) }
