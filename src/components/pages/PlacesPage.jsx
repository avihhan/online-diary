import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import { motion, AnimatePresence } from 'framer-motion'
import { useDiary } from '../../state/useDiary'
import { useAuth, USERS } from '../../state/useAuth'
import { playClick, playSelect, playError } from '../../utils/sounds'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
if (MAPBOX_TOKEN) mapboxgl.accessToken = MAPBOX_TOKEN

const STATUS_LABELS = {
  visited: 'Been There',
  want: 'Wanna Go',
}

/**
 * Tiny preview map. Renders an actual Mapbox canvas at low DPR so the result
 * looks chunky/pixelated. Click-to-interact is disabled so the only effect of
 * clicking is to open the lightbox.
 */
function MiniMap({ places, onOpen }) {
  const wrap = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map())

  useEffect(() => {
    if (!wrap.current || mapRef.current || !MAPBOX_TOKEN) return
    const map = new mapboxgl.Map({
      container: wrap.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 20],
      zoom: 0.5,
      interactive: false,
      attributionControl: false,
      pixelRatio: 0.6, // chunky / pixelated look
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const seen = new Set()
    places.forEach((p) => {
      seen.add(p.id)
      const color = p.addedBy === 'avi' ? USERS.avi.color : USERS.gracelynn.color
      let marker = markersRef.current.get(p.id)
      if (!marker) {
        const el = document.createElement('div')
        el.style.width = '8px'
        el.style.height = '8px'
        el.style.border = '2px solid #2b1a26'
        el.style.transform = 'rotate(45deg)'
        marker = new mapboxgl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map)
        markersRef.current.set(p.id, marker)
      }
      marker.getElement().style.background = color
    })
    markersRef.current.forEach((m, id) => {
      if (!seen.has(id)) {
        m.remove()
        markersRef.current.delete(id)
      }
    })
  }, [places])

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="mini-map mini-map--placeholder"
        onClick={() => {
          playError()
        }}
      >
        Set VITE_MAPBOX_TOKEN to enable the map.
      </div>
    )
  }

  return (
    <button
      type="button"
      className="mini-map"
      onClick={() => {
        playClick()
        onOpen()
      }}
      title="Click to open the full map"
    >
      <div ref={wrap} className="mini-map__canvas" />
      <div className="mini-map__overlay">
        <span className="mini-map__cta">▣ Open Map</span>
      </div>
    </button>
  )
}

/**
 * Fullscreen map lightbox. Click anywhere to drop a pin; the pin's title +
 * status come from a popup, exactly like before, but with much more room.
 */
function MapLightbox({ open, onClose, places, onAdd }) {
  const wrap = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map())
  const popupRef = useRef(null)
  const user = useAuth((s) => s.user)

  useEffect(() => {
    if (!open || !wrap.current || mapRef.current || !MAPBOX_TOKEN) return
    const map = new mapboxgl.Map({
      container: wrap.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 20],
      zoom: 1.4,
      attributionControl: false,
    })
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new mapboxgl.AttributionControl({ compact: true }))

    map.on('click', (e) => {
      if (popupRef.current) popupRef.current.remove()
      const node = document.createElement('div')
      node.style.fontFamily = 'var(--font-typewriter)'
      const popup = new mapboxgl.Popup({ closeButton: true, closeOnClick: false, offset: 10 })
        .setLngLat(e.lngLat)
        .setDOMContent(node)
        .addTo(map)
      popupRef.current = popup
      const root = createRoot(node)
      root.render(
        <PinPopup
          lng={e.lngLat.lng}
          lat={e.lngLat.lat}
          onAdd={async (input) => {
            await onAdd({ ...input, addedBy: user })
          }}
          onClose={() => popup.remove()}
        />,
      )
    })

    mapRef.current = map

    // Resize after mount to fill modal
    setTimeout(() => map.resize(), 50)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [open, onAdd, user])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const seen = new Set()
    places.forEach((p) => {
      seen.add(p.id)
      const color = p.addedBy === 'avi' ? USERS.avi.color : USERS.gracelynn.color
      const opacity = p.status === 'visited' ? 1 : 0.7
      let marker = markersRef.current.get(p.id)
      if (!marker) {
        const el = document.createElement('div')
        el.style.width = '18px'
        el.style.height = '18px'
        el.style.borderRadius = '50%'
        el.style.border = '3px solid #2b1a26'
        el.style.boxShadow = '0 2px 0 rgba(0,0,0,0.3)'
        el.style.cursor = 'pointer'
        marker = new mapboxgl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map)
        markersRef.current.set(p.id, marker)
      }
      const el = marker.getElement()
      el.style.background = color
      el.style.opacity = String(opacity)
      el.title = `${p.title} -- ${STATUS_LABELS[p.status] || ''}`
    })
    markersRef.current.forEach((m, id) => {
      if (!seen.has(id)) {
        m.remove()
        markersRef.current.delete(id)
      }
    })
  }, [places, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="map-lightbox"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="map-lightbox__head">
              <div className="map-lightbox__title">Our Map · click anywhere to add a pin</div>
              <button
                className="retro-btn"
                onClick={() => {
                  playClick()
                  onClose()
                }}
              >
                Close
              </button>
            </div>
            <div className="map-lightbox__body" ref={wrap} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PinPopup({ lng, lat, onAdd, onClose }) {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('want')
  return (
    <div style={{ padding: 6, minWidth: 220 }}>
      <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, marginBottom: 6 }}>
        New pin
      </div>
      <input
        className="retro-input"
        placeholder="Short title"
        value={title}
        autoFocus
        onChange={(e) => setTitle(e.target.value)}
        style={{ marginBottom: 8, fontSize: 16, padding: 6 }}
      />
      <div className="page-toolbar" style={{ marginBottom: 8 }}>
        <button
          type="button"
          className={`seg ${status === 'want' ? 'active' : ''}`}
          onClick={() => setStatus('want')}
        >
          Wanna Go
        </button>
        <button
          type="button"
          className={`seg ${status === 'visited' ? 'active' : ''}`}
          onClick={() => setStatus('visited')}
        >
          Been There
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          className="retro-btn ghost"
          onClick={onClose}
          style={{ fontSize: 9, padding: '6px 10px' }}
        >
          Cancel
        </button>
        <button
          type="button"
          className="retro-btn"
          style={{ fontSize: 9, padding: '6px 10px' }}
          onClick={() => {
            if (!title.trim()) return
            playSelect()
            onAdd({ title: title.trim(), lat, lng, status })
            onClose()
          }}
        >
          Add Pin
        </button>
      </div>
    </div>
  )
}

export default function PlacesPage() {
  const places = useDiary((s) => s.places)
  const placesLoaded = useDiary((s) => s.placesLoaded)
  const placesLoading = useDiary((s) => s.placesLoading)
  const loadPlaces = useDiary((s) => s.loadPlaces)
  const addPlace = useDiary((s) => s.addPlace)
  const setPlaceStatus = useDiary((s) => s.setPlaceStatus)
  const deletePlace = useDiary((s) => s.deletePlace)

  const [filter, setFilter] = useState('all')
  const [lbOpen, setLbOpen] = useState(false)

  useEffect(() => {
    if (!placesLoaded) loadPlaces()
  }, [placesLoaded, loadPlaces])

  const grouped = useMemo(() => {
    const out = { visited: [], want: [] }
    for (const p of places) {
      const key = p.status === 'visited' ? 'visited' : 'want'
      out[key].push(p)
    }
    return out
  }, [places])

  const visible = filter === 'all' ? places : places.filter((p) => p.status === filter)

  return (
    <div className="page-surface">
      <div className="corner-ribbon">~ Page 2 ~</div>
      <h1>Our Map</h1>

      <MiniMap places={places} onOpen={() => setLbOpen(true)} />

      <div className="page-toolbar" style={{ marginTop: 10 }}>
        <button className={`seg ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All ({places.length})
        </button>
        <button
          className={`seg ${filter === 'visited' ? 'active' : ''}`}
          onClick={() => setFilter('visited')}
        >
          Been ({grouped.visited.length})
        </button>
        <button className={`seg ${filter === 'want' ? 'active' : ''}`} onClick={() => setFilter('want')}>
          Wanna ({grouped.want.length})
        </button>
      </div>

      <ul className="list">
        {placesLoading && !placesLoaded && <div className="loading">Loading map...</div>}
        {placesLoaded && visible.length === 0 && (
          <div className="empty">Click the map to drop your first pin.</div>
        )}
        {visible.map((p) => {
          const profile = USERS[p.addedBy] || USERS.gracelynn
          return (
            <li key={p.id} className="list-item">
              <span className={`pencil ${profile.tone}`} title={profile.label} />
              <div className="text">
                <div style={{ fontSize: 16 }}>{p.title}</div>
                <div className="meta">{STATUS_LABELS[p.status] || ''}</div>
              </div>
              <button
                className="del"
                title={p.status === 'visited' ? 'Mark as wanna go' : 'Mark as been there'}
                onClick={() => {
                  playClick()
                  setPlaceStatus(p.id, p.status === 'visited' ? 'want' : 'visited')
                }}
              >
                ↻
              </button>
              <button
                className="del"
                onClick={() => {
                  playClick()
                  deletePlace(p.id)
                }}
                title="Delete"
              >
                x
              </button>
            </li>
          )
        })}
      </ul>

      <MapLightbox
        open={lbOpen}
        onClose={() => setLbOpen(false)}
        places={places}
        onAdd={addPlace}
      />
    </div>
  )
}
