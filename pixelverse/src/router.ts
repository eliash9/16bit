import { createRouter, createWebHistory } from 'vue-router'
const copy: Record<string, [string, string]> = {
  agency: ['Meet the agency', 'Meet the creative party behind PIXELVERSE, a demo independent digital agency.'],
  services: ['Design & development services', 'Brand strategy, interface design, websites and interactive digital experiences by PIXELVERSE.'],
  portfolio: ['Selected portfolio', 'Explore three illustrative PIXELVERSE projects: Orbit, Terra and Goodkind.'],
  contact: ['Start a project', 'Plan your next digital project with the PIXELVERSE contact form.'],
}
export const router = createRouter({ history: createWebHistory(), routes: [
  { path: '/', component: () => import('./views/TownView.vue'), meta: { title: 'Explore the town', description: 'A small world. Endless possibilities. Explore PIXELVERSE, an independent digital design and development agency.' } },
  ...Object.entries(copy).map(([id, [title, description]]) => ({ path: `/${id}`, component: () => import('./views/ContentView.vue'), props: { id }, meta: { title, description } })),
  { path: '/:pathMatch(.*)*', redirect: '/' },
] })
router.afterEach(to => {
  document.title = `${to.meta.title} — PIXELVERSE`
  document.querySelector('meta[name="description"]')?.setAttribute('content', String(to.meta.description))
})
