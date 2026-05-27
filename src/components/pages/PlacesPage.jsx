import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import { useDiary } from '../../state/useDiary'
import { useAuth, USERS } from '../../state/useAuth'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN
if (MAPBOX_TOKEN) mapboxgl.accessToken = MAPBOX_TOKEN

const STATUS_LABELS = {
  visited: 'Been There',
  want: 'Wanna Go',
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
        <button type="button" className="retro-btn ghost" onClick={onClose} style={{ fontSize: 9, padding: '6px 10px' }}>
          Cancel
        </button>
        <button
          type="button"
          className="retro-btn"
          style={{ fontSize: 9, padding: '6px 10px' }}
          onClick={() => {
            if (!title.trim()) return
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
  const mapWrap = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map())
  const popupRef = useRef(null)
  const popupRootRef = useRef(null)

  const places = useDiary((s) => s.places)
  const placesLoaded = useDiary((s) => s.placesLoaded)
  const placesLoading = useDiary((s) => s.placesLoading)
  const loadPlaces = useDiary((s) => s.loadPlaces)
  const addPlace = useDiary((s) => s.addPlace)
  const setPlaceStatus = useDiary((s) => s.setPlaceStatus)
  const deletePlace = useDiary((s) => s.deletePlace)
  const user = useAuth((s) => s.user)

  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!placesLoaded) loadPlaces()
  }, [placesLoaded, loadPlaces])

  useEffect(() => {
    if (!mapWrap.current || mapRef.current) return
    if (!MAPBOX_TOKEN) return

    const map = new mapboxgl.Map({
      container: mapWrap.current,
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
      popupRootRef.current = root
      root.render(
        <PinPopup
          lng={e.lngLat.lng}
          lat={e.lngLat.lat}
          onAdd={async (input) => {
            await addPlace({ ...input, addedBy: user })
          }}
          onClose={() => popup.remove()}
        />,
      )
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [addPlace, user])

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
        el.title = p.title
        marker = new mapboxgl.Marker({ element: el }).setLngLat([p.lng, p.lat]).addTo(map)
        markersRef.current.set(p.id, marker)
      }
      const el = marker.getElement()
      el.style.background = color
      el.style.opacity = String(opacity)
      el.title = `${p.title} — ${STATUS_LABELS[p.status] || ''}`
    })

    markersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
      }
    })
  }, [places])

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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          flex: 1,
          minHeight: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="page-toolbar">
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
                    <div style={{ fontSize: 18 }}>{p.title}</div>
                    <div className="meta">{STATUS_LABELS[p.status] || ''}</div>
                  </div>
                  <button
                    className="del"
                    title={p.status === 'visited' ? 'Mark as wanna go' : 'Mark as been there'}
                    onClick={() =>
                      setPlaceStatus(p.id, p.status === 'visited' ? 'want' : 'visited')
                    }
                  >
                    ↻
                  </button>
                  <button className="del" onClick={() => deletePlace(p.id)} title="Delete">
                    x
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {MAPBOX_TOKEN ? (
            <div className="map-wrap" ref={mapWrap} />
          ) : (
            <div
              className="map-wrap"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 18,
                background: 'var(--pink-cream)',
                textAlign: 'center',
                fontFamily: 'var(--font-pixel)',
                fontSize: 10,
                lineHeight: 1.6,
              }}
            >
              Set VITE_MAPBOX_TOKEN in your env to enable the map.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
