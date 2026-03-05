import Image from 'next/image'

type BrandLogoProps = {
  className?: string
  priority?: boolean
  iconOnly?: boolean
  alt?: string
}

export default function BrandLogo({
  className,
  priority = false,
  iconOnly = false,
  alt = 'VIVENTA',
}: BrandLogoProps) {
  if (iconOnly) {
    return (
      <Image
        src="/logo-icon.svg"
        alt={alt}
        width={40}
        height={40}
        className={className}
        priority={priority}
      />
    )
  }

  return (
    <Image
      src="/logo.svg"
      alt={alt}
      width={180}
      height={56}
      className={className}
      priority={priority}
    />
  )
}
