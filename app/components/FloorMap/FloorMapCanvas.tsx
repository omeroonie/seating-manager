'use client'

import { useEffect, useRef, useCallback } from 'react'
import type {
  Floor,
  AssetType,
  Resource,
  FloorItemMovedDetail,
  AssetDroppedDetail,
  FloorMapCanvas as FloorMapCanvasElement,
} from './floor-map-canvas'

// The static side-effect import registers the custom element.
// This file is only ever loaded client-side because FloorMapClient.tsx
// imports it via next/dynamic with ssr:false.
import './floor-map-canvas'

// Teach React's JSX about the custom element
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'floor-map-canvas': React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement>,
          HTMLElement
        >
      }
    }
  }
}

interface FloorMapCanvasProps {
  floor:        Floor | null
  assetTypes:   AssetType[]
  resources:    Resource[]
  onItemMoved:  (id: string, x: number, y: number) => void
  onAssetDropped: (detail: AssetDroppedDetail) => void
}

/**
 * Thin React wrapper around the <floor-map-canvas> Lit web component.
 *
 * Object/array props are set imperatively via a ref (web components don't
 * receive serialised attribute values for complex types).
 * Custom events are mapped to React callback props.
 */
export function FloorMapCanvasWrapper({
  floor,
  assetTypes,
  resources,
  onItemMoved,
  onAssetDropped,
}: FloorMapCanvasProps) {
  const ref = useRef<FloorMapCanvasElement>(null)

  // Push complex props down imperatively whenever they change
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.floor      = floor
    el.assetTypes = assetTypes
    el.resources  = resources
  }, [floor, assetTypes, resources])

  // Stable event handlers (avoids re-registering on every render)
  const handleItemMoved = useCallback(
    (e: Event) => {
      const { id, x, y } = (e as CustomEvent<FloorItemMovedDetail>).detail
      onItemMoved(id, x, y)
    },
    [onItemMoved],
  )

  const handleAssetDropped = useCallback(
    (e: Event) => {
      onAssetDropped((e as CustomEvent<AssetDroppedDetail>).detail)
    },
    [onAssetDropped],
  )

  // Attach / detach custom-event listeners
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('floor-item-moved', handleItemMoved)
    el.addEventListener('asset-dropped',    handleAssetDropped)
    return () => {
      el.removeEventListener('floor-item-moved', handleItemMoved)
      el.removeEventListener('asset-dropped',    handleAssetDropped)
    }
  }, [handleItemMoved, handleAssetDropped])

  // The Lit element manages its own internal DOM — pass a ref and let it do its work.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <floor-map-canvas ref={ref as any} />
}
