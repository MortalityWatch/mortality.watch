import { watch } from 'vue'
import { createRouter, createWebHistory, type Router } from 'vue-router'

export class MyRouter {
  programmatic = false
  // state: Serializable
  router: Router

  constructor() {
    // this.state = state
    this.router = createRouter({
      history: createWebHistory(import.meta.env.BASE_URL),
      scrollBehavior() {
        return { top: 0 }
      },
      routes: [
        {
          path: '/',
          name: 'home',
          component: () => import('@/views/StartView.vue'),
          beforeEnter: (to, from, next) => {
            if (to.query.qr) next({ path: '/explorer', query: to.query })
            else next()
          }
        },
        {
          path: '/explorer',
          name: 'explorer',
          component: () => import('@/views/ExplorerView.vue')
        },
        {
          path: '/ranking',
          name: 'ranking',
          component: () => import('@/views/RankingView.vue')
        },
        {
          path: '/about',
          name: 'about',
          component: () => import('@/views/AboutView.vue')
        },
        {
          path: '/sources',
          name: 'sources',
          component: () => import('@/views/SourcesView.vue')
        },
        {
          path: '/donate',
          name: 'donate',
          component: () => import('@/views/DonateView.vue')
        }
      ]
    })

    // Handle Back / Forward Browser button click
    watch(this.router.currentRoute, async () => {
      if (
        this.programmatic
        || !this.router.currentRoute.value.path.includes('explorer')
      )
        return
      // const savedState = this.savedState()
      // if (savedState) state.initFromSavedState(savedState)
    })
  }

  async init() {
    // Set initial url.
    const savedState = this.savedState()
    if (!savedState) await this.update()
  }

  savedState = () => {
    const state = this.router.currentRoute.value.query
    return Object.keys(state).length > 0 ? state : undefined
  }

  async update() {
    this.programmatic = true
    await this.router.push({
      path: '/explorer/'
      // query: this.state.encryptState()
    })
    this.programmatic = false
  }
}
