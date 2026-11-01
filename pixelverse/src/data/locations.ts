import type { LocationId } from '../game/bridge'
export const locations: { id: LocationId; name: string; short: string; subtitle: string; icon: string; color: string; x: number; y: number }[] = [
  { id: 'agency', name: 'Agency HQ', short: 'The agency', subtitle: 'Meet your creative party', icon: '⚑', color: '#92bdff', x: 304, y: 288 },
  { id: 'portfolio', name: 'Portfolio Castle', short: 'Our work', subtitle: 'Explore our greatest builds', icon: '♜', color: '#c2a1ff', x: 704, y: 288 },
  { id: 'services', name: 'Service Workshop', short: 'Our services', subtitle: 'Find your next power-up', icon: '⚒', color: '#f6bd6a', x: 304, y: 560 },
  { id: 'contact', name: 'Contact Portal', short: 'Let’s talk', subtitle: 'Start a new adventure', icon: '✧', color: '#7de4cb', x: 704, y: 560 },
]
