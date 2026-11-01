import type { StopId } from '../data/wedding'
export interface Point { x: number; y: number }
interface Events { ready: undefined; move: Point; pause: boolean; nearby: StopId | null; enter: StopId; interact: undefined; home: undefined; position: Point; hint: StopId; }
class Bridge {
  private target = new EventTarget()
  emit<K extends keyof Events>(key: K, detail: Events[K]) { this.target.dispatchEvent(new CustomEvent(key, { detail })) }
  on<K extends keyof Events>(key: K, fn: (value: Events[K]) => void) { const listener = (e: Event) => fn((e as CustomEvent).detail); this.target.addEventListener(key, listener); return () => this.target.removeEventListener(key, listener) }
}
export const bridge = new Bridge()
