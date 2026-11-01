let context: AudioContext | undefined, timer: ReturnType<typeof setInterval> | undefined
const notes = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66, 261.63, 329.63, 392, 440, 392, 329.63, 293.66, 329.63]
export function stopMusic() { if (timer) clearInterval(timer); timer = undefined; void context?.suspend() }
export async function startMusic() {
  context ??= new AudioContext(); await context.resume()
  if (timer) return
  let i = 0
  const tick = () => { if (!context || context.state !== 'running') return; const osc = context.createOscillator(), gain = context.createGain(); osc.type = 'triangle'; osc.frequency.value = notes[i++ % notes.length]!; gain.gain.setValueAtTime(.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(.035, context.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .55); osc.connect(gain); gain.connect(context.destination); osc.start(); osc.stop(context.currentTime + .6) }
  tick(); timer = setInterval(tick, 430)
}
