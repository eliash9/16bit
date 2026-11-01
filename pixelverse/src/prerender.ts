import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from './App.vue'
import ContentView from './views/ContentView.vue'
export async function render(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/', component: { render: () => null } },
    ...['agency', 'services', 'portfolio', 'contact'].map(id => ({ path: `/${id}`, component: ContentView, props: { id } })),
  ] })
  const app = createSSRApp(App).use(createPinia()).use(router)
  await router.push(path)
  await router.isReady()
  return renderToString(app)
}
