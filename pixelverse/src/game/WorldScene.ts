import Phaser from 'phaser'
import { bridge, type Point, type LocationId } from './bridge'
import { locations } from '../data/locations'
import { findPath, isWalkable, type Obstacle } from './pathfinding'

export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private shadow!: Phaser.GameObjects.Ellipse
  private obstacles: Obstacle[] = []
  private walls!: Phaser.Physics.Arcade.StaticGroup
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private joystick: Point = { x: 0, y: 0 }
  private path: Point[] = []
  private nearby: LocationId | null = null
  private paused = false
  private reduced = false
  private muted = true
  private facing = 'down'
  private cleanups: (() => void)[] = []
  private lastSave = 0
  private marker!: Phaser.GameObjects.Arc
  private audio?: AudioContext
  constructor() { super('world') }

  create() {
    this.obstacles = []
    this.walls = this.physics.add.staticGroup()
    this.physics.world.setBounds(16, 16, 992, 736)
    this.paintTown()
    const saved = this.registry.get('position') as Point | undefined
    const start = saved && isWalkable(saved.x, saved.y, this.obstacles) ? saved : { x: 512, y: 400 }
    this.player = this.physics.add.sprite(start.x, start.y, 'player-down-0').setScale(2).setDepth(start.y)
    this.player.body!.setSize(8, 5).setOffset(4, 10)
    this.player.setCollideWorldBounds(true)
    this.shadow = this.add.ellipse(start.x, start.y + 11, 22, 8, 0x192e27, 0.25).setDepth(start.y - 1)
    this.physics.add.collider(this.player, this.walls)
    this.marker = this.add.circle(0, 0, 7).setStrokeStyle(2, 0xffeab4).setVisible(false).setDepth(1)
    this.cameras.main.startFollow(this.player, true, 1, 1)
    this.resize(this.scale.gameSize)
    this.scale.on('resize', this.resize, this)
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE') as Record<string, Phaser.Input.Keyboard.Key>
    const enterKey = (event: KeyboardEvent) => {
      if (!event.repeat && document.activeElement === this.game.canvas) this.interact()
    }
    this.input.keyboard!.on('keydown-E', enterKey)
    this.input.keyboard!.on('keydown-SPACE', enterKey)
    // Only capture gameplay keys while the canvas has keyboard focus.
    this.input.keyboard!.disableGlobalCapture()
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.game.canvas.focus()
      if (this.paused) return
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
      this.path = findPath(this.player, p, this.obstacles)
      const destination = this.path.at(-1)
      this.marker.setVisible(Boolean(destination))
      if (destination) this.marker.setPosition(destination.x, destination.y)
    })
    this.cleanups = [
      () => this.input.keyboard?.off('keydown-E', enterKey),
      () => this.input.keyboard?.off('keydown-SPACE', enterKey),
      bridge.on('move', vector => { this.joystick = vector; this.path = []; this.marker.setVisible(false) }),
      bridge.on('pause', value => { this.paused = value; this.path = []; this.joystick = { x: 0, y: 0 } }),
      bridge.on('interact', () => this.interact()),
      bridge.on('mute', value => { this.muted = value }),
      bridge.on('reducedMotion', value => { this.reduced = value }),
      bridge.on('snapshot', () => bridge.emit('position', { x: this.player.x, y: this.player.y })),
      bridge.on('home', () => { this.player.setPosition(512, 400); this.path = []; this.marker.setVisible(false) }),
    ]
    const blur = () => { this.joystick = { x: 0, y: 0 }; this.path = []; this.input.keyboard?.resetKeys() }
    window.addEventListener('blur', blur)
    this.cleanups.push(() => window.removeEventListener('blur', blur))
    this.events.once('shutdown', () => {
      bridge.emit('position', { x: this.player.x, y: this.player.y })
      this.cleanups.forEach(cleanup => cleanup())
      this.scale.off('resize', this.resize, this)
      this.input.removeAllListeners()
      this.input.keyboard?.removeAllKeys(true)
      void this.audio?.close()
    })
    bridge.emit('ready', undefined)
  }
  private resize(size: Phaser.Structs.Size) {
    const camera = this.cameras.main.setZoom(size.width < 600 ? 0.625 : 0.75)
    const padX = Math.max(0, (size.width / camera.zoom - 1024) / 2)
    const padY = Math.max(0, (size.height / camera.zoom - 768) / 2)
    camera.setBounds(-padX, -padY, 1024 + padX * 2, 768 + padY * 2)
  }
  private interact() {
    if (!this.nearby || this.paused) return
    if (!this.muted) {
      try {
        this.audio ??= new AudioContext()
        void this.audio.resume()
        const oscillator = this.audio.createOscillator(), gain = this.audio.createGain()
        oscillator.type = 'square'; oscillator.frequency.setValueAtTime(660, this.audio.currentTime)
        oscillator.frequency.setValueAtTime(880, this.audio.currentTime + 0.07)
        gain.gain.setValueAtTime(0.025, this.audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, this.audio.currentTime + 0.15)
        oscillator.connect(gain); gain.connect(this.audio.destination)
        oscillator.start(); oscillator.stop(this.audio.currentTime + 0.16)
      } catch { /* Audio is optional. */ }
    }
    bridge.emit('enter', this.nearby)
  }
  update(time: number, delta: number) {
    if (!this.player) return
    this.player.setVelocity(0)
    const focused = document.activeElement === this.game.canvas
    let x = this.joystick.x, y = this.joystick.y
    if (focused) {
      x += Number(this.keys.D!.isDown || this.keys.RIGHT!.isDown) - Number(this.keys.A!.isDown || this.keys.LEFT!.isDown)
      y += Number(this.keys.S!.isDown || this.keys.DOWN!.isDown) - Number(this.keys.W!.isDown || this.keys.UP!.isDown)
    }
    if (this.paused) { this.player.anims.stop(); return }
    if (Math.abs(x) + Math.abs(y) > 0.05) { this.path = []; this.marker.setVisible(false) }
    else if (this.path.length) {
      const next = this.path[0]!, distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, next.x, next.y)
      if (distance < Math.max(3, 125 * delta / 1000)) { this.player.setPosition(next.x, next.y); this.path.shift() }
      else { x = (next.x - this.player.x) / distance; y = (next.y - this.player.y) / distance }
      if (!this.path.length) this.marker.setVisible(false)
    }
    const moving = Math.abs(x) + Math.abs(y) > 0.05
    if (moving) {
      const vector = new Phaser.Math.Vector2(x, y).limit(1).scale(125)
      this.player.setVelocity(vector.x, vector.y)
      this.facing = Math.abs(x) > Math.abs(y) ? x > 0 ? 'right' : 'left' : y > 0 ? 'down' : 'up'
      if (!this.reduced) this.player.play(`walk-${this.facing}`, true)
    }
    if (!moving || this.reduced) { this.player.anims.stop(); this.player.setTexture(`player-${this.facing}-0`) }
    this.player.setDepth(this.player.y)
    this.shadow.setPosition(this.player.x, this.player.y + 11).setDepth(this.player.y - 1)
    const nearby = locations.find(location => Phaser.Math.Distance.Between(this.player.x, this.player.y, location.x, location.y) < 54)?.id ?? null
    if (nearby !== this.nearby) { this.nearby = nearby; bridge.emit('nearby', nearby) }
    if (time - this.lastSave > 1000) { this.lastSave = time; bridge.emit('position', { x: this.player.x, y: this.player.y }) }
  }

  private block(x: number, y: number, width: number, height: number) {
    this.obstacles.push({ x, y, width, height })
    const wall = this.add.rectangle(x + width / 2, y + height / 2, width, height).setVisible(false)
    this.walls.add(wall)
  }
  private paintTown() {
    const g = this.add.graphics().setDepth(-10)
    const rect = (x: number, y: number, w: number, h: number, color: number) => { g.fillStyle(color).fillRect(x, y, w, h) }
    let seed = 1234
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    rect(-1024, -768, 3072, 2304, 0x6b9560)
    for (let i = 0; i < 4200; i++) {
      const x = Math.floor(random() * 512) * 2, y = Math.floor(random() * 384) * 2
      rect(x, y, 2, random() > 0.5 ? 4 : 2, [0x739d65, 0x628c56, 0x7ca16a][Math.floor(random() * 3)]!)
    }
    // Sand paths and a broad village square.
    rect(472, 80, 80, 624, 0xb29d73); rect(144, 360, 736, 88, 0xb29d73)
    rect(480, 80, 64, 624, 0xd6c094); rect(144, 368, 736, 72, 0xd6c094)
    rect(272, 272, 64, 288, 0xd6c094); rect(672, 272, 64, 288, 0xd6c094)
    rect(272, 536, 464, 48, 0xd6c094)
    rect(448, 336, 128, 136, 0xd6c094)
    for (let i = 0; i < 800; i++) {
      const x = Math.floor(random() * 512) * 2, y = Math.floor(random() * 384) * 2
      if ((x > 480 && x < 544 && y > 80 && y < 704) || (x > 144 && x < 880 && y > 368 && y < 440) || (y > 536 && y < 584 && x > 272 && x < 736)) rect(x, y, 3, 2, random() > 0.5 ? 0xc7ae83 : 0xe1cea4)
    }
    // Pond with reeds, stone bank, and a tiny timber bridge.
    rect(790, 482, 160, 152, 0x577e53); rect(802, 492, 144, 128, 0x839e7c)
    rect(812, 502, 128, 108, 0x508b96); rect(824, 494, 98, 124, 0x508b96)
    rect(824, 508, 108, 94, 0x66a7aa)
    for (let i = 0; i < 22; i++) rect(830 + Math.floor(random() * 90), 514 + Math.floor(random() * 80), 12, 2, 0x9ac8bd)
    rect(786, 540, 64, 32, 0x665442)
    for (let i = 0; i < 8; i++) rect(787 + i * 8, 542, 6, 28, 0xb39a69)
    this.block(850, 494, 94, 124); this.block(806, 494, 44, 42); this.block(806, 580, 44, 38)
    // Pixel pines are individual depth-sorted textures for natural occlusion.
    const tree = (x: number, y: number, scale = 1) => {
      const t = this.add.graphics().setPosition(x, y).setScale(scale).setDepth(y)
      const r = (a: number, b: number, w: number, h: number, c: number) => t.fillStyle(c).fillRect(a, b, w, h)
      t.fillStyle(0x304d39, 0.25).fillEllipse(4, 2, 54, 16)
      r(-5, -22, 10, 26, 0x63513d); r(-2, -22, 4, 26, 0x94704a)
      for (let tier = 0; tier < 3; tier++) {
        const top = -72 + tier * 17, width = 22 + tier * 14
        for (let row = 0; row < 4; row++) r(-width / 2 - row * 4, top + row * 8, width + row * 8, 9, [0x315e43, 0x39734a, 0x448253][tier]!)
        r(-width / 2 + 3, top + 8, 7, 8, 0x55915c)
      }
      this.block(x - 9 * scale, y - 8 * scale, 18 * scale, 14 * scale)
    }
    for (let x = 32; x < 1024; x += 48) { tree(x, 86 + random() * 25, 1.1); tree(x + 10, 752 + random() * 16, 1.05) }
    for (let y = 130; y < 720; y += 50) { tree(40 + random() * 26, y); tree(978 + random() * 25, y) }
    for (const [x, y] of [[136, 208], [188, 298], [142, 510], [164, 626], [220, 674], [400, 636], [592, 654], [805, 180], [872, 246], [874, 330], [616, 150], [430, 180], [808, 664]]) tree(x!, y!)
    // Stone fountain in the square, offset to keep the crossing walkable.
    g.fillStyle(0x9d926e).fillEllipse(512, 354, 82, 35)
    rect(480, 338, 64, 24, 0x8a8f83); rect(488, 334, 48, 28, 0xb3b5a0)
    rect(490, 338, 44, 16, 0x629eaa); rect(506, 320, 12, 26, 0xbfc4ad)
    rect(502, 316, 20, 8, 0xd8d4b9); rect(508, 311, 8, 7, 0x94d7ce)
    this.block(480, 330, 64, 28)
    // Four distinctive landmarks.
    this.building(304, 264, 'agency', 0x687fa6, 0xd1cbb4)
    this.building(704, 264, 'portfolio', 0x87779b, 0xaeb0ac)
    this.building(304, 536, 'services', 0xad6d4e, 0xcebb91)
    this.portal(704, 524)
    // Flower patches, lamps, and benches.
    for (const [x, y] of [[218, 338], [386, 326], [620, 322], [784, 324], [204, 584], [400, 590], [619, 588], [768, 596]]) {
      for (let i = 0; i < 8; i++) {
        const px = x! + Math.floor(random() * 28), py = y! + Math.floor(random() * 16)
        rect(px, py, 2, 6, 0x4d7748); rect(px - 2, py, 6, 3, [0xf5d47d, 0xe7a3a0, 0xe6e1b2][i % 3]!)
      }
    }
    for (const [x, y] of [[418, 378], [598, 432], [350, 562], [752, 386]]) {
      rect(x!, y! - 28, 4, 30, 0x595441); rect(x! - 4, y! - 34, 12, 10, 0xdbc68b); rect(x! - 6, y! - 36, 16, 4, 0x585448)
    }
    for (const [x, y] of [[398, 478], [578, 306]]) { rect(x!, y!, 34, 12, 0x927451); rect(x!, y! + 4, 34, 3, 0xb69a69); rect(x! + 2, y! + 12, 4, 6, 0x65573f); rect(x! + 28, y! + 12, 4, 6, 0x65573f); this.block(x!, y!, 34, 12) }
    this.add.text(512, 652, '✦  A LITTLE WORLD OF BIG IDEAS  ✦', { fontFamily: 'monospace', fontSize: '10px', color: '#3d6244', letterSpacing: 2 }).setOrigin(0.5)
  }
  private building(x: number, y: number, id: LocationId, roof: number, wall: number) {
    const g = this.add.graphics().setDepth(y - 4)
    const r = (a: number, b: number, w: number, h: number, c: number) => { g.fillStyle(c).fillRect(x + a, y + b, w, h) }
    g.fillStyle(0x344b34, 0.25).fillEllipse(x + 5, y + 3, 164, 28)
    r(-64, -80, 128, 80, 0x655e50); r(-60, -78, 120, 74, wall)
    r(-60, -8, 120, 8, 0x88816b); r(-62, -80, 124, 8, 0x424d52)
    for (let i = 0; i < 8; i++) {
      r(-76 + i * 7, -80 - i * 7, 152 - i * 14, 8, roof)
      r(-76 + i * 7, -80 - i * 7, 152 - i * 14, 2, Phaser.Display.Color.IntegerToColor(roof).lighten(12).color)
    }
    r(-76, -82, 152, 6, 0x474b50)
    for (const a of [-43, 25]) { r(a, -56, 20, 28, 0x625e54); r(a + 3, -53, 14, 21, 0x839fa9); r(a + 9, -53, 2, 21, 0xe0cfaa); r(a + 3, -44, 14, 2, 0xe0cfaa); r(a - 3, -29, 26, 5, 0xebe0b5) }
    r(-12, -37, 24, 37, 0x514735); r(-8, -33, 16, 33, 0x8c7150); r(3, -20, 3, 3, 0xf0cf79)
    r(-18, 0, 36, 6, 0xb1aa8e); r(-22, 6, 44, 5, 0xd2c6a4)
    if (id === 'agency') {
      r(-6, -162, 3, 30, 0x675746); r(-3, -162, 26, 15, 0x95b9df); r(0, -159, 17, 3, 0xd4e5e3)
      r(43, -124, 15, 25, 0x8b8272); r(40, -128, 21, 6, 0xada38b)
    }
    if (id === 'portfolio') {
      for (const a of [-80, 52]) {
        r(a, -118, 28, 118, 0x929799); r(a + 3, -114, 22, 108, 0xb8b9af)
        r(a - 3, -124, 34, 14, 0xc6c5b7)
        for (let i = 0; i < 3; i++) r(a - 3 + i * 13, -134, 8, 16, 0xb9bcb3)
        r(a + 10, -94, 8, 17, 0x5a6676); r(a + 10, -48, 8, 17, 0x5a6676)
      }
      r(-3, -159, 3, 31, 0x625b65); r(0, -159, 24, 14, 0xb69bcf)
    }
    if (id === 'services') {
      r(36, -140, 22, 45, 0x796b5a); r(33, -145, 28, 7, 0xa79c85)
      r(-60, -69, 120, 11, 0x8c6549)
      for (let i = 0; i < 8; i++) r(-60 + i * 15, -69, 8, 14, 0xead8aa)
      r(67, -28, 21, 28, 0x856847); r(65, -25, 25, 4, 0xc1a475); r(65, -8, 25, 4, 0xc1a475)
    }
    this.block(x - (id === 'portfolio' ? 80 : 64), y - 76, id === 'portfolio' ? 160 : 128, 76)
    this.label(x, y - 176, locations.find(l => l.id === id)!.name, id === 'agency' ? '#c5dcff' : id === 'portfolio' ? '#dfc5ff' : '#fce0ad')
  }
  private portal(x: number, y: number) {
    const g = this.add.graphics().setDepth(y)
    const r = (a: number, b: number, w: number, h: number, c: number) => { g.fillStyle(c).fillRect(x + a, y + b, w, h) }
    g.fillStyle(0x375e4b, 0.3).fillEllipse(x, y + 12, 116, 35)
    r(-50, 0, 100, 12, 0x8d9583); r(-42, -6, 84, 12, 0xb5b59a)
    r(-35, -78, 70, 72, 0x385b64); r(-26, -91, 52, 86, 0x385b64)
    r(-25, -72, 50, 65, 0x548c8c); r(-17, -81, 34, 74, 0x68b7aa)
    r(-10, -71, 20, 62, 0x88d3b6); r(-3, -61, 6, 46, 0xb6ead0)
    for (const a of [-42, 28]) { r(a, -80, 14, 80, 0x949d8c); for (let b = -76; b < 0; b += 18) r(a + 2, b, 10, 3, 0xc2c5aa) }
    r(-34, -95, 68, 18, 0xa8ad98); r(-22, -107, 44, 16, 0xb7bba1)
    r(-5, -103, 10, 12, 0x8be2c0)
    for (const [a, b] of [[-53, -58], [52, -82], [35, -115], [-37, -119]]) { r(a!, b!, 3, 9, 0xd7f4ca); r(a! - 3, b! + 3, 9, 3, 0xd7f4ca) }
    this.block(x - 42, y - 90, 84, 88)
    this.label(x, y - 145, 'Contact Portal', '#bdffe1')
  }
  private label(x: number, y: number, text: string, color: string) {
    const label = this.add.text(x, y, text.toUpperCase(), { fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold', color, backgroundColor: '#293d38ee', padding: { x: 9, y: 6 }, letterSpacing: 1 }).setOrigin(0.5).setDepth(1000)
    label.setStroke('#293d38', 1)
  }
}
