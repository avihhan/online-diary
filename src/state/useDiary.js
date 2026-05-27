import { create } from 'zustand'
import { api } from '../api/client'
import { playFlip } from '../utils/sounds'

const PAGES = ['toc', 'places', 'bucket', 'dates', 'thoughts']

export const useDiary = create((set, get) => ({
  pageIndex: 0,
  flipping: false,
  direction: 1,

  places: [],
  placesLoaded: false,
  placesLoading: false,

  bucket: [],
  bucketLoaded: false,
  bucketLoading: false,

  thoughts: [],
  thoughtsLoaded: false,
  thoughtsLoading: false,

  dates: [],
  datesLoaded: false,
  datesLoading: false,

  goTo(name) {
    const idx = typeof name === 'number' ? name : PAGES.indexOf(name)
    if (idx < 0 || idx === get().pageIndex) return
    playFlip()
    set({
      pageIndex: idx,
      direction: idx > get().pageIndex ? 1 : -1,
      flipping: true,
    })
    setTimeout(() => set({ flipping: false }), 850)
  },
  next() {
    const idx = Math.min(PAGES.length - 1, get().pageIndex + 1)
    get().goTo(idx)
  },
  prev() {
    const idx = Math.max(0, get().pageIndex - 1)
    get().goTo(idx)
  },

  async loadPlaces() {
    set({ placesLoading: true })
    try {
      const res = await api.get('/places')
      set({ places: res.data.items || [], placesLoaded: true })
    } catch (err) {
      console.error('loadPlaces failed', err)
    } finally {
      set({ placesLoading: false })
    }
  },
  async addPlace(input) {
    const res = await api.post('/places', input)
    if (res.data?.ok && res.data.item) {
      set({ places: [...get().places, res.data.item] })
    }
    return res.data?.item
  },
  async setPlaceStatus(id, status) {
    set({
      places: get().places.map((p) => (p.id === id ? { ...p, status } : p)),
    })
    try {
      await api.patch('/places', { id, status })
    } catch (err) {
      console.error('setPlaceStatus failed', err)
    }
  },
  async deletePlace(id) {
    set({ places: get().places.filter((p) => p.id !== id) })
    try {
      await api.delete('/places', { params: { id } })
    } catch (err) {
      console.error('deletePlace failed', err)
    }
  },

  async loadBucket() {
    set({ bucketLoading: true })
    try {
      const res = await api.get('/bucket')
      set({ bucket: res.data.items || [], bucketLoaded: true })
    } catch (err) {
      console.error('loadBucket failed', err)
    } finally {
      set({ bucketLoading: false })
    }
  },
  async addBucket(text, addedBy) {
    const res = await api.post('/bucket', { text, addedBy })
    if (res.data?.ok && res.data.item) {
      set({ bucket: [...get().bucket, res.data.item] })
    }
  },
  async toggleBucket(id, checked, checkedBy) {
    set({
      bucket: get().bucket.map((b) =>
        b.id === id ? { ...b, checked, checkedBy: checked ? checkedBy : '' } : b,
      ),
    })
    try {
      await api.patch('/bucket', { id, checked, checkedBy })
    } catch (err) {
      console.error('toggleBucket failed', err)
    }
  },
  async deleteBucket(id) {
    set({ bucket: get().bucket.filter((b) => b.id !== id) })
    try {
      await api.delete('/bucket', { params: { id } })
    } catch (err) {
      console.error('deleteBucket failed', err)
    }
  },

  async loadThoughts() {
    set({ thoughtsLoading: true })
    try {
      const res = await api.get('/thoughts')
      set({ thoughts: res.data.items || [], thoughtsLoaded: true })
    } catch (err) {
      console.error('loadThoughts failed', err)
    } finally {
      set({ thoughtsLoading: false })
    }
  },
  async addThought(text, author) {
    const res = await api.post('/thoughts', { text, author })
    if (res.data?.ok && res.data.item) {
      set({ thoughts: [res.data.item, ...get().thoughts] })
    }
  },
  async deleteThought(id) {
    set({ thoughts: get().thoughts.filter((t) => t.id !== id) })
    try {
      await api.delete('/thoughts', { params: { id } })
    } catch (err) {
      console.error('deleteThought failed', err)
    }
  },

  async loadDates() {
    set({ datesLoading: true })
    try {
      const res = await api.get('/dates')
      set({ dates: res.data.items || [], datesLoaded: true })
    } catch (err) {
      console.error('loadDates failed', err)
    } finally {
      set({ datesLoading: false })
    }
  },
  async addDate({ title, date, notes, addedBy }) {
    const res = await api.post('/dates', { title, date, notes, addedBy })
    if (res.data?.ok && res.data.item) {
      const next = [...get().dates, res.data.item].sort((a, b) =>
        (a.date || '').localeCompare(b.date || ''),
      )
      set({ dates: next })
    }
    return res.data?.item
  },
  async deleteDate(id) {
    set({ dates: get().dates.filter((d) => d.id !== id) })
    try {
      await api.delete('/dates', { params: { id } })
    } catch (err) {
      console.error('deleteDate failed', err)
    }
  },

  resetData() {
    set({
      places: [],
      placesLoaded: false,
      bucket: [],
      bucketLoaded: false,
      thoughts: [],
      thoughtsLoaded: false,
      dates: [],
      datesLoaded: false,
      pageIndex: 0,
    })
  },
}))

export const PAGE_NAMES = PAGES
