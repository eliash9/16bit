import type { Point } from './bridge'
export const TILE = 16
export const COLS = 64
export const ROWS = 48
export interface Obstacle { x: number; y: number; width: number; height: number }
export function isWalkable(x: number, y: number, obstacles: Obstacle[]) {
  return x >= 24 && y >= 24 && x <= COLS * TILE - 24 && y <= ROWS * TILE - 24 && !obstacles.some(o => x > o.x - 7 && x < o.x + o.width + 7 && y > o.y - 7 && y < o.y + o.height + 7)
}
/** Breadth-first grid search gives tap targets a collision-safe route. */
export function findPath(start: Point, target: Point, obstacles: Obstacle[]): Point[] {
  const cell = (p: Point) => ({ x: Math.floor(p.x / TILE), y: Math.floor(p.y / TILE) })
  const a = cell(start), b = cell(target)
  const key = (p: Point) => p.y * COLS + p.x
  const center = (p: Point) => ({ x: p.x * TILE + 8, y: p.y * TILE + 8 })
  if (!isWalkable(center(b).x, center(b).y, obstacles)) return []
  const queue = [a], previous = new Map<number, Point | null>([[key(a), null]])
  for (let index = 0; index < queue.length; index++) {
    const p = queue[index]!
    if (key(p) === key(b)) {
      const path: Point[] = []
      let current: Point | null = p
      while (current && key(current) !== key(a)) { path.unshift(center(current)); current = previous.get(key(current)) ?? null }
      return path
    }
    for (const next of [{ x: p.x + 1, y: p.y }, { x: p.x - 1, y: p.y }, { x: p.x, y: p.y + 1 }, { x: p.x, y: p.y - 1 }]) {
      const c = center(next)
      if (!previous.has(key(next)) && isWalkable(c.x, c.y, obstacles)) { previous.set(key(next), p); queue.push(next) }
    }
  }
  return []
}
