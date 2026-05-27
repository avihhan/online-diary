import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useDiary, PAGE_NAMES } from '../state/useDiary'
import TableOfContents from './TableOfContents'
import PlacesPage from './pages/PlacesPage'
import BucketListPage from './pages/BucketListPage'
import ThoughtsPage from './pages/ThoughtsPage'
import DatesPage from './pages/DatesPage'
import EndCoverPage from './pages/EndCoverPage'

const PAGE_COMPONENTS = {
  toc: TableOfContents,
  places: PlacesPage,
  bucket: BucketListPage,
  dates: DatesPage,
  thoughts: ThoughtsPage,
  end: EndCoverPage,
}

const variants = {
  enter: (direction) => ({
    rotateY: direction > 0 ? -160 : 160,
    opacity: 0,
    transformOrigin: direction > 0 ? '0% 50%' : '100% 50%',
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    transformOrigin: '50% 50%',
  },
  exit: (direction) => ({
    rotateY: direction > 0 ? 160 : -160,
    opacity: 0,
    transformOrigin: direction > 0 ? '100% 50%' : '0% 50%',
  }),
}

/**
 * The "inside" of the book: a CSS-3D framed page with a smooth flip animation
 * between sections. Real DOM lives here so Mapbox + form inputs work normally.
 */
export default function OpenBook({ visible }) {
  const pageIndex = useDiary((s) => s.pageIndex)
  const direction = useDiary((s) => s.direction)
  const name = PAGE_NAMES[pageIndex] || 'toc'
  const PageComp = PAGE_COMPONENTS[name]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: visible ? 'auto' : 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 700ms ease 200ms',
        perspective: '2200px',
      }}
    >
      {/* Open-book frame (leather edge around pages) */}
      <div
        className="open-book-frame"
        style={{
          position: 'relative',
          width: 'min(640px, 96vw)',
          height: 'min(820px, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 140px))',
          minHeight: 320,
          background:
            'linear-gradient(135deg, #6b3a1d 0%, #4a2410 60%, #3f2010 100%)',
          borderRadius: 8,
          boxShadow:
            '0 30px 60px rgba(60, 10, 40, 0.45), inset 0 0 30px rgba(0,0,0,0.4)',
        }}
      >
        {/* Spine highlight */}
        <div
          style={{
            position: 'absolute',
            left: -2,
            top: 16,
            bottom: 16,
            width: 8,
            background: 'linear-gradient(to right, #3f2010, #6b3a1d)',
            borderRadius: '4px 0 0 4px',
            boxShadow: '-2px 0 6px rgba(0,0,0,0.4)',
          }}
        />
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
          }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={name}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.55, 0.05, 0.25, 1] }}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
              }}
            >
              {PageComp ? <PageComp /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
