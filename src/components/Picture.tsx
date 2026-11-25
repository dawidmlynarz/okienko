import { pictureSvg, type PictureId } from '../assets/pictures'

/** One picture from the house set (src/assets/drawn.ts). */
export function Picture({ id, size = 64, className = '' }: { id: PictureId; size?: number | string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 [&>svg]:size-full ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: pictureSvg[id] }}
    />
  )
}
