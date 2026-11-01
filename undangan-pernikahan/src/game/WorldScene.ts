import Phaser from 'phaser'
import { bridge, type Point } from './bridge'
import { stops, type StopId } from '../data/wedding'
import { state, save } from '../state'
import { findPath, isWalkable, type Obstacle } from './pathfinding'

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private obstacles: Obstacle[] = []
  private vector: Point = { x: 0, y: 0 }
  private path: Point[] = []
  private nearby: StopId | null = null
  private paused = false
  private facing = 'up'
  private cleanup: (() => void)[] = []
  private shadow!: Phaser.GameObjects.Ellipse
  private destination!: Phaser.GameObjects.Arc
  private lamps: Phaser.GameObjects.Text[] = []
  private lastSave = 0
  private motion = matchMedia('(prefers-reduced-motion: reduce)')
  constructor() { super('world') }
  create() {
    this.paint()
    this.physics.world.setBounds(24, 32, 752, 1216)
    const p = state.position
    const start = isWalkable(p.x, p.y, this.obstacles) ? p : { x: 400, y: 1180 }
    this.player = this.physics.add.sprite(start.x, start.y, 'player-up-0').setScale(2).setDepth(start.y)
    this.player.body!.setSize(8, 6).setOffset(4, 9)
    this.player.setCollideWorldBounds(true)
    const walls = this.physics.add.staticGroup()
    for (const o of this.obstacles) walls.add(this.add.rectangle(o.x + o.width / 2, o.y + o.height / 2, o.width, o.height).setVisible(false))
    this.physics.add.collider(this.player, walls)
    this.shadow = this.add.ellipse(start.x, start.y + 12, 24, 8, 0x233c2e, .25)
    this.destination = this.add.circle(0, 0, 7).setStrokeStyle(2, 0xffe7b3).setVisible(false)
    this.cameras.main.startFollow(this.player, true, .12, .12)
    this.resize(this.scale.gameSize)
    this.scale.on('resize', this.resize, this)
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE') as Record<string, Phaser.Input.Keyboard.Key>
    this.input.keyboard!.disableGlobalCapture()
    const interact = (e: KeyboardEvent) => { if (!e.repeat && document.activeElement === this.game.canvas) this.interact() }
    this.input.keyboard!.on('keydown-E', interact).on('keydown-SPACE', interact)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.paused) return
      this.game.canvas.focus({ preventScroll: true })
      const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
      // Tapping a landmark walks to its clear interaction area.
      const stop = stops.find(s => Math.abs(s.x - point.x) < 66 && point.y > s.y - 115 && point.y < s.y + 30)
      const target = stop ? { x: stop.x, y: stop.y + 36 } : point
      this.path = findPath(this.player, target, this.obstacles)
      const end = this.path.at(-1)
      this.destination.setVisible(Boolean(end)); if (end) this.destination.setPosition(end.x, end.y)
    })
    const reset = () => { this.vector = { x: 0, y: 0 }; this.path = []; this.input.keyboard?.resetKeys(); this.destination.setVisible(false) }
    this.cleanup = [bridge.on('move', v => { this.vector = v; this.path = []; this.destination.setVisible(false) }), bridge.on('pause', value => { this.paused = value; reset() }), bridge.on('interact', () => this.interact()), bridge.on('home', () => { reset(); this.player.setPosition(400, 1160) }), bridge.on('hint', id => { const s = stops.find(s => s.id === id)!; this.path = findPath(this.player, { x: s.x, y: s.y + 36 }, this.obstacles) })]
    window.addEventListener('blur', reset)
    this.events.once('shutdown', () => { this.persist(); this.cleanup.forEach(fn => fn()); window.removeEventListener('blur', reset); this.scale.off('resize', this.resize, this) })
    bridge.emit('ready', undefined)
  }
  private resize(size: Phaser.Structs.Size) { this.cameras.main.setZoom(size.width < 600 ? 1.15 : 1.3).setBounds(-160, -320, 1120, 1920).setFollowOffset(0, -20) }
  private interact() { if (!this.paused && this.nearby && (this.nearby === 'welcome' || state.found.includes('welcome'))) bridge.emit('enter', this.nearby) }
  private persist() { if (!this.player) return; state.position = { x: this.player.x, y: this.player.y }; save('position', state.position) }
  update(time: number, delta: number) {
    if (!this.player) return
    this.player.setVelocity(0)
    this.lamps.forEach((lamp, i) => { lamp.setText(state.found.includes(stops[i]!.id) ? '✓' : '!'); lamp.setY(stops[i]!.y - 130 + (this.motion.matches ? 0 : Math.sin(time / 400 + i) * 3)) })
    if (this.paused) { this.player.anims.stop(); return }
    let { x, y } = this.vector
    if (document.activeElement === this.game.canvas) { x += Number(this.keys.D!.isDown || this.keys.RIGHT!.isDown) - Number(this.keys.A!.isDown || this.keys.LEFT!.isDown); y += Number(this.keys.S!.isDown || this.keys.DOWN!.isDown) - Number(this.keys.W!.isDown || this.keys.UP!.isDown) }
    if (Math.hypot(x, y) > .05) this.path = []
    else if (this.path.length) {
      const next = this.path[0]!, distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, next.x, next.y)
      if (distance < Math.max(3, 145 * delta / 1000)) { this.player.setPosition(next.x, next.y); this.path.shift() }
      else { x = (next.x - this.player.x) / distance; y = (next.y - this.player.y) / distance }
      if (!this.path.length) this.destination.setVisible(false)
    }
    if (Math.hypot(x, y) > .05) { const v = new Phaser.Math.Vector2(x, y).limit(1).scale(145); this.player.setVelocity(v.x, v.y); this.facing = Math.abs(x) > Math.abs(y) ? x > 0 ? 'right' : 'left' : y > 0 ? 'down' : 'up'; if (!this.motion.matches) this.player.play(`walk-${this.facing}`, true) }
    else { this.player.anims.stop(); this.player.setTexture(`player-${this.facing}-0`) }
    this.player.setDepth(this.player.y); this.shadow.setPosition(this.player.x, this.player.y + 12).setDepth(this.player.y - 1)
    const nearby = stops.find(s => Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y + 24) < 62)?.id ?? null
    if (nearby !== this.nearby) { this.nearby = nearby; bridge.emit('nearby', nearby) }
    if (time - this.lastSave > 1000) { this.persist(); this.lastSave = time }
  }
  private paint() {
    const g = this.add.graphics().setDepth(-100)
    const r = (x: number, y: number, w: number, h: number, c: number) => g.fillStyle(c).fillRect(x, y, w, h)
    let seed = 77; const rand = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647 }
    r(0, 0, 800, 1280, 0x739570)
    for (let i = 0; i < 6000; i++) r(Math.floor(rand() * 400) * 2, Math.floor(rand() * 640) * 2, 2, 4, [0x7e9f78, 0x6c8f68, 0x89a57b][i % 3]!)
    r(364, 190, 72, 1040, 0xb3aa80); r(372, 190, 56, 1040, 0xd8c7a0)
    for (const y of [404, 644, 884]) { r(248, y - 14, 304, 52, 0xb3aa80); r(248, y - 8, 304, 40, 0xd8c7a0) }
    r(334, 1056, 132, 88, 0xd8c7a0)
    for (let i = 0; i < 240; i++) r(376 + Math.floor(rand() * 24) * 2, 230 + Math.floor(rand() * 470) * 2, 4, 2, 0xc6b58f)
    // Pond and stepping stones.
    r(60, 930, 158, 154, 0x9da88b); r(68, 938, 142, 138, 0x527c80); r(78, 946, 122, 120, 0x74a8a5)
    for (let i = 0; i < 22; i++) r(84 + rand() * 96, 952 + rand() * 100, 14, 2, 0xa8ccc0)
    for (let i = 0; i < 5; i++) { r(91 + i * 18, 995, 12, 14, 0xc9c4ab); r(93 + i * 18, 995, 8, 3, 0xe0dcc7) }
    const tree = (x: number, y: number, size = 1) => {
      const t = this.add.graphics().setPosition(x, y).setScale(size).setDepth(y)
      const q = (a: number, b: number, w: number, h: number, c: number) => t.fillStyle(c).fillRect(a, b, w, h)
      t.fillStyle(0x2a4837, .18).fillEllipse(0, 0, 62, 18)
      q(-5, -26, 10, 28, 0x786648); q(-2, -23, 4, 23, 0xa08b61)
      q(-28, -62, 56, 38, 0x426a4b); q(-36, -54, 72, 24, 0x426a4b); q(-24, -72, 48, 44, 0x547f54); q(-16, -78, 32, 40, 0x678e60); q(-25, -59, 16, 14, 0x81a06c); q(10, -43, 17, 9, 0x638959)
      this.obstacles.push({ x: x - 9, y: y - 10, width: 18, height: 14 })
    }
    for (let y = 90; y < 1260; y += 64) { tree(40 + rand() * 35, y); tree(730 + rand() * 30, y) }
    for (let x = 100; x < 730; x += 60) { tree(x, 130); if (x < 330 || x > 470) tree(x, 1260) }
    for (const [x, y] of [[155, 330], [645, 460], [160, 710], [651, 740], [618, 1050], [155, 1170]]) tree(x!, y!, 1.15)
    // Tiny flowers and lanterns along the main path.
    for (let y = 240; y < 1180; y += 60) for (const x of [346, 450]) { r(x, y, 2, 9, 0x486b46); r(x - 3, y - 2, 8, 5, y % 120 === 0 ? 0xefbcb0 : 0xf0d99e); r(x, y - 3, 2, 7, 0xf6e4bc) }
    for (const y of [480, 720, 960]) for (const x of [350, 446]) { r(x, y - 27, 4, 29, 0x6a6450); r(x - 4, y - 35, 12, 12, 0xf3d9a0); r(x - 6, y - 38, 16, 4, 0x56664c) }
    // Wedding arch at the northern end.
    r(335, 200, 8, 84, 0xe1d9ba); r(457, 200, 8, 84, 0xe1d9ba); r(335, 194, 130, 10, 0xe1d9ba); r(346, 184, 108, 12, 0xece1c5)
    for (let i = 0; i < 10; i++) { r(336 + i * 13, 188, 12, 10, i % 2 ? 0xe6b5ae : 0x90ad77) }
    this.add.text(400, 236, 'A + B', { fontFamily: 'Georgia', fontSize: '25px', color: '#f8ebce' }).setOrigin(.5)
    for (const s of stops) {
      const art = this.add.graphics().setPosition(s.x, s.y).setDepth(s.y - 8)
      const q = (x: number, y: number, w: number, h: number, c: number) => art.fillStyle(c).fillRect(x, y, w, h)
      art.fillStyle(0x304f39, .18).fillEllipse(0, 3, 120, 24)
      if (s.id === 'welcome') { q(-6, -56, 12, 57, 0x846b4c); q(-29, -81, 58, 36, 0x675841); q(-25, -77, 50, 28, 0xf2deba); q(-23, -75, 46, 3, 0xffedcd); q(-20, -70, 16, 3, 0xc59b85); q(13, -73, 8, 9, 0xb77871); q(-15, 0, 30, 6, 0xa39068) }
      else if (s.id === 'couple') { q(-56, -16, 112, 22, 0xc2b28d); q(-49, -80, 6, 65, 0xe5d6b2); q(43, -80, 6, 65, 0xe5d6b2); q(-59, -86, 118, 10, 0xe6c0b4); q(-48, -98, 96, 12, 0xe8c7ba); q(-35, -108, 70, 10, 0xeed7bd); q(-29, -54, 18, 18, 0x453b37); q(-27, -49, 14, 14, 0xe8b793); q(-35, -34, 30, 34, 0xf2e8d2); q(10, -56, 18, 18, 0x443b37); q(12, -50, 14, 14, 0xe8b793); q(8, -34, 25, 28, 0x52635b); q(17, -34, 5, 17, 0xf1e1c5) }
      else if (s.id === 'event') { q(-37, -5, 8, 14, 0x716249); q(29, -5, 8, 14, 0x716249); q(-48, -90, 96, 88, 0x7e7055); q(-43, -85, 86, 76, 0xefdfb9); q(-43, -85, 86, 18, s.color); for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) q(-31 + j * 18, -55 + i * 15, 9, 7, i === 1 && j === 2 ? 0xb97670 : 0xc1b591) }
      else if (s.id === 'location') { q(-5, -78, 10, 84, 0x806b4b); q(-48, -82, 96, 42, 0x8a7857); q(-43, -77, 86, 32, 0xc6d1b0); q(-28, -67, 38, 5, 0x6e927a); q(1, -62, 24, 5, 0x6e927a); q(13, -73, 8, 14, 0xbd8273) }
      else if (s.id === 'story') { q(-48, -43, 96, 40, 0x8a7151); q(-44, -39, 88, 31, 0xd1bb91); q(-33, -65, 29, 29, 0xf4dfbc); q(5, -65, 29, 29, 0xf4dfbc); q(-29, -61, 21, 18, 0xbab2cd); q(9, -61, 21, 18, 0xa8bfa4); q(-43, -95, 88, 3, 0x76674e); for (let i = 0; i < 5; i++) q(-40 + i * 18, -92, 12, 15, i % 2 ? 0xf1d6b1 : 0xdfb3a7) }
      else if (s.id === 'rsvp') { q(-42, -32, 7, 38, 0x7b664b); q(35, -32, 7, 38, 0x7b664b); q(-51, -41, 102, 12, 0xba9470); q(-27, -55, 54, 14, 0xf0dfba); q(0, -53, 2, 11, 0xc0ac89); q(27, -70, 4, 22, 0x616b50); q(24, -74, 10, 9, 0xe9c3a8) }
      else { q(-34, -47, 68, 50, 0x8e744b); q(-38, -47, 76, 15, 0xc5a16a); q(-30, -56, 60, 10, 0xc5a16a); q(-30, -26, 60, 4, 0xc4a66e); q(-5, -40, 10, 22, 0xf0d799); q(-2, -32, 4, 9, 0x88704a) }
      this.obstacles.push({ x: s.x - (s.id === 'welcome' ? 30 : 51), y: s.y - 80, width: s.id === 'welcome' ? 60 : 102, height: 84 })
      this.lamps.push(this.add.text(s.x, s.y - 130, '!', { fontFamily: 'monospace', fontSize: '18px', color: '#f6e6bd', backgroundColor: '#405641', padding: { x: 7, y: 3 } }).setOrigin(.5).setDepth(2000))
      this.add.text(s.x, s.y + 58, s.id === 'welcome' ? 'SURAT UNTUKMU' : s.subtitle.toUpperCase(), { fontFamily: 'monospace', fontSize: '9px', color: '#304e39', backgroundColor: '#c7c49c', padding: { x: 5, y: 4 } }).setOrigin(.5)
    }
    // Strings of small festoon lights over the paths.
    for (const y of [500, 980]) { g.lineStyle(1, 0x5c7356).beginPath().moveTo(210, y - 18).lineTo(400, y + 8).lineTo(590, y - 18).strokePath(); for (let i = 0; i < 13; i++) { const x = 210 + i * 31; r(x, y - 14 + (1 - Math.abs(x - 400) / 190) * 26, 4, 6, 0xf5ddb0) } }
  }
}
