import Phaser from 'phaser'
/** Asset contract: replace these named textures with a pixel-art atlas later. */
export class BootScene extends Phaser.Scene {
  constructor() { super('boot') }
  create() {
    const palette: Record<string, number> = { '.': 0, h: 0x30273a, s: 0xffd5a0, b: 0x7597db, d: 0x364a79, w: 0xf3e6bd, r: 0xb85b52 }
    const base = ['.....hhhhhh.....','....hhhhhhhh....','....hssssssh....','....hshsshsh....','.....ssssss.....','......ss........','....bbbbbbbb....','...bbbwbbwbbb...','...sbbwwwwbbs...','...sbbbbbbbbs...','....dddddddd....','....ddd..ddd....','....ddd..ddd....','....hhh..hhh....','................','................']
    const g = this.make.graphics({ x: 0, y: 0 })
    for (const direction of ['down', 'up', 'left', 'right']) {
      for (let frame = 0; frame < 3; frame++) {
        g.clear()
        base.forEach((row, y) => [...row].forEach((pixel, x) => {
          if (pixel === '.') return
          let color = palette[pixel]!
          if (direction === 'up' && y < 6) color = y < 4 ? palette.h! : palette.r!
          if ((direction === 'left' && x > 9 || direction === 'right' && x < 6) && y > 2 && y < 5) color = palette.h!
          const offset = y > 10 && frame > 0 ? (x < 8 ? frame === 1 ? -1 : 1 : frame === 1 ? 1 : -1) : 0
          g.fillStyle(color).fillRect(x, y + offset, 1, 1)
        }))
        g.generateTexture(`player-${direction}-${frame}`, 16, 16)
      }
      this.anims.create({ key: `walk-${direction}`, frames: [0, 1, 0, 2].map(frame => ({ key: `player-${direction}-${frame}` })), frameRate: 8, repeat: -1 })
    }
    g.destroy()
    this.scene.start('world')
  }
}
