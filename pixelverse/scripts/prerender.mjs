import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { render } from '../.prerender/prerender.js'
const template = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
const pages = {
  agency: ['Meet the agency', 'Meet the creative party behind PIXELVERSE, a demo independent digital agency.'],
  services: ['Design & development services', 'Brand strategy, interface design, websites and interactive digital experiences by PIXELVERSE.'],
  portfolio: ['Selected portfolio', 'Explore three illustrative PIXELVERSE projects: Orbit, Terra and Goodkind.'],
  contact: ['Start a project', 'Plan your next digital project with the PIXELVERSE contact form.'],
}
for (const [id, [title, description]] of Object.entries(pages)) {
  const html = template.replace('<div id="app"></div>', `<div id="app">${await render(`/${id}`)}</div>`)
    .replace(/<title>.*?<\/title>/, `<title>${title.replaceAll('&', '&amp;')} — PIXELVERSE</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`)
  const directory = new URL(`../dist/${id}/`, import.meta.url)
  await mkdir(directory, { recursive: true })
  await writeFile(new URL('index.html', directory), html)
  console.log(`Prerendered /${id}`)
}
