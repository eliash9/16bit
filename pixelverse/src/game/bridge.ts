export type LocationId = 'agency' | 'portfolio' | 'services' | 'contact'
export interface Point { x: number; y: number }
export interface GameEvents {
  ready: undefined; position: Point; nearby: LocationId | null; enter: LocationId
  move: Point; interact: undefined; pause: boolean; mute: boolean; home: undefined; reducedMotion: boolean; snapshot: undefined
}
class EventBridge {
  private target = new EventTarget()
  emit<K extends keyof GameEvents>(type: K, detail: GameEvents[K]) { this.target.dispatchEvent(new CustomEvent(type, { detail })) }
  on<K extends keyof GameEvents>(type: K, callback: (payload: GameEvents[K]) => void) {
    const listener = (event: Event) => callback((event as CustomEvent<GameEvents[K]>).detail)
    this.target.addEventListener(type, listener)
    return () => this.target.removeEventListener(type, listener)
  }
}
export const bridge = new EventBridge()
