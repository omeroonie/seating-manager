import { LitElement, html, svg, css, type TemplateResult } from 'lit'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'

// ── Types ────────────────────────────────────────────────────────────────────

export interface Position { x: number; y: number }

export interface FloorItem {
  id: string
  type: string
  pos: Position
  rotation?: number
  label?: string
  assignedTo?: string
}

export interface Floor {
  id: string
  name: string
  width: number
  height: number
  items: FloorItem[]
}

export interface AssetType { id: string; name: string; svgData: string }

export interface Resource { id: string; name: string; project: string }

export interface FloorItemMovedDetail { id: string; x: number; y: number }

export interface AssetDroppedDetail {
  x: number
  y: number
  isExistingAsset?: boolean
  assetId?: string
  assetTypeId?: string
  assetTypeName?: string
}

interface SVGShapeElement { type: string; [key: string]: unknown }
interface SVGShapeData { type: string; elements: SVGShapeElement[] }

// ── Web Component ─────────────────────────────────────────────────────────────

export class FloorMapCanvas extends LitElement {
  // Declared via static properties (no decorators needed)
  static properties = {
    floor:      { type: Object },
    assetTypes: { type: Array },
    resources:  { type: Array },
  }

  floor:      Floor | null  = null
  assetTypes: AssetType[]   = []
  resources:  Resource[]    = []

  // Internal drag state – managed manually, not through Lit reactivity
  private _dragItemId:      string | null   = null
  private _dragItemPos:     Position | null = null
  private _dragStartOffset: Position | null = null
  private _isDragOver                       = false

  private _onMouseMove: ((e: MouseEvent) => void) | null = null
  private _onMouseUp:   ((e: MouseEvent) => void) | null = null

  static styles = css`
    :host {
      display: block;
    }
    .canvas-wrapper {
      overflow: auto;
      border: 2px solid #E5E7EB;
      border-radius: 8px;
      background: #F9FAFB;
      transition: border-color 0.15s, background-color 0.15s;
    }
    .canvas-wrapper.drag-over {
      border-color: #3B82F6;
      background-color: #EFF6FF;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      min-height: 400px;
      max-height: 800px;
    }
  `

  disconnectedCallback() {
    super.disconnectedCallback()
    this._removeDragListeners()
  }

  // ── Coordinate helpers ────────────────────────────────────────────────────

  private _svgElement(): SVGSVGElement | null {
    return (this.renderRoot?.querySelector('svg') as SVGSVGElement) ?? null
  }

  private _toSVGCoords(clientX: number, clientY: number): Position {
    const svgEl = this._svgElement()
    if (!svgEl) return { x: clientX, y: clientY }
    const pt = svgEl.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const svgP = pt.matrixTransform(svgEl.getScreenCTM()!.inverse())
    return { x: svgP.x, y: svgP.y }
  }

  // ── Item drag (reposition) ────────────────────────────────────────────────

  private _removeDragListeners() {
    if (this._onMouseMove) window.removeEventListener('mousemove', this._onMouseMove)
    if (this._onMouseUp)   window.removeEventListener('mouseup',   this._onMouseUp)
    this._onMouseMove = null
    this._onMouseUp   = null
  }

  private _handleItemMouseDown(e: MouseEvent, item: FloorItem) {
    if (e.button !== 0) return
    e.stopPropagation()
    e.preventDefault()

    this._removeDragListeners()

    const origin = this._toSVGCoords(e.clientX, e.clientY)
    this._dragStartOffset = { x: origin.x - item.pos.x, y: origin.y - item.pos.y }
    this._dragItemId      = item.id
    this._dragItemPos     = { ...item.pos }
    this.requestUpdate()

    this._onMouseMove = (ev: MouseEvent) => {
      if (!this._dragStartOffset) return
      const c = this._toSVGCoords(ev.clientX, ev.clientY)
      this._dragItemPos = {
        x: c.x - this._dragStartOffset.x,
        y: c.y - this._dragStartOffset.y,
      }
      this.requestUpdate()
    }

    this._onMouseUp = () => {
      this._removeDragListeners()

      const finalPos  = this._dragItemPos
      const id        = this._dragItemId
      const origPos   = this.floor?.items.find(i => i.id === id)?.pos

      this._dragItemId      = null
      this._dragItemPos     = null
      this._dragStartOffset = null
      this.requestUpdate()

      if (finalPos && id && origPos) {
        if (Math.abs(finalPos.x - origPos.x) > 1 || Math.abs(finalPos.y - origPos.y) > 1) {
          this.dispatchEvent(new CustomEvent<FloorItemMovedDetail>('floor-item-moved', {
            bubbles: true, composed: true,
            detail: { id, x: finalPos.x, y: finalPos.y },
          }))
        }
      }
    }

    window.addEventListener('mousemove', this._onMouseMove)
    window.addEventListener('mouseup',   this._onMouseUp)
  }

  // ── External drag-and-drop (assets from panel) ────────────────────────────

  private _handleDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer?.types.includes('application/json')) {
      e.dataTransfer.dropEffect = 'copy'
      if (!this._isDragOver) { this._isDragOver = true; this.requestUpdate() }
    }
  }

  private _handleDragLeave(e: DragEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (
      e.clientX < rect.left || e.clientX >= rect.right ||
      e.clientY < rect.top  || e.clientY >= rect.bottom
    ) {
      this._isDragOver = false
      this.requestUpdate()
    }
  }

  private _handleDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    this._isDragOver = false
    this.requestUpdate()

    const raw = e.dataTransfer?.getData('application/json')
    if (!raw) return

    let data: Record<string, unknown>
    try { data = JSON.parse(raw) } catch { return }

    const { x, y } = this._toSVGCoords(e.clientX, e.clientY)
    this.dispatchEvent(new CustomEvent<AssetDroppedDetail>('asset-dropped', {
      bubbles: true, composed: true,
      detail: { ...(data as unknown as AssetDroppedDetail), x, y },
    }))
  }

  // ── SVG rendering helpers ─────────────────────────────────────────────────

  /**
   * Build a safe SVG string from the stored JSON shape data.
   * Attribute values are escaped; only known SVG shape tags are emitted.
   */
  private _buildSVGString(elements: SVGShapeElement[]): string {
    const ALLOWED_TAGS = new Set(['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path', 'text'])
    return elements
      .filter(({ type }) => ALLOWED_TAGS.has(String(type)))
      .map(({ type, ...attrs }) => {
        const attrStr = Object.entries(attrs)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => `${k}="${String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
          .join(' ')
        return `<${type} ${attrStr}/>`
      })
      .join('')
  }

  private _renderItem(item: FloorItem): TemplateResult | null {
    const assetType = this.assetTypes.find(
      at => at.name.toLowerCase() === item.type.toLowerCase()
    )
    if (!assetType) return null

    let shape: SVGShapeData
    try { shape = JSON.parse(assetType.svgData) } catch { return null }

    const isDragging = this._dragItemId === item.id
    const pos        = isDragging && this._dragItemPos ? this._dragItemPos : item.pos
    const rotation   = item.rotation ?? 0
    const assignedName = item.assignedTo
      ? this.resources.find(r => r.id === item.assignedTo)?.name
      : undefined

    const labelY      = shape.type === 'desk' ? 50 : 40
    const labelSize   = shape.type === 'desk' ? 12 : 10
    const labelWeight = shape.type === 'desk' ? 'bold' : 'normal'

    return svg`
      <g
        transform="translate(${pos.x}, ${pos.y}) rotate(${rotation})"
        style="${isDragging ? 'opacity:0.7;cursor:grabbing' : 'cursor:grab'}"
        @mousedown=${(e: MouseEvent) => this._handleItemMouseDown(e, { ...item, pos })}
      >
        ${unsafeSVG(this._buildSVGString(shape.elements))}
        ${item.label ? svg`
          <text
            x="0" y="${labelY}"
            font-size="${labelSize}" font-weight="${labelWeight}"
            fill="#333" text-anchor="middle" pointer-events="none"
          >${item.label}</text>
        ` : null}
        ${assignedName && shape.type === 'desk' ? svg`
          <text x="0" y="65" font-size="10" fill="#666" text-anchor="middle" pointer-events="none"
          >${assignedName}</text>
        ` : null}
      </g>
    `
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render() {
    if (!this.floor) {
      return html`
        <div class="canvas-wrapper">
          <div style="padding:3rem;text-align:center;color:#6B7280;">No floor selected</div>
        </div>
      `
    }

    const { width, height, items } = this.floor

    return html`
      <div
        class=${this._isDragOver ? 'canvas-wrapper drag-over' : 'canvas-wrapper'}
        @dragover=${this._handleDragOver}
        @dragleave=${this._handleDragLeave}
        @drop=${this._handleDrop}
      >
        <svg
          width="${width}"
          height="${height}"
          viewBox="0 0 ${width} ${height}"
        >
          ${svg`
            <rect x="0" y="0" width="${width}" height="${height}"
                  fill="#F5F5F5" stroke="#CCCCCC" stroke-width="2"/>
            <defs>
              <pattern id="floor-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#E0E0E0" stroke-width="0.5"/>
              </pattern>
            </defs>
            <rect x="0" y="0" width="${width}" height="${height}" fill="url(#floor-grid)"/>
            ${items.map(item => this._renderItem(item))}
          `}
        </svg>
      </div>
    `
  }
}

customElements.define('floor-map-canvas', FloorMapCanvas)

// Extend the global HTML element registry for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    'floor-map-canvas': FloorMapCanvas
  }
}
