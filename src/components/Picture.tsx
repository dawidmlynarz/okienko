import { pictureSvg, type PictureId } from '../assets/pictures'

export function Picture({ id, size = 64, className = '' }: { id: PictureId; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 [&>svg]:size-full ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: pictureSvg[id] }}
    />
  )
}
