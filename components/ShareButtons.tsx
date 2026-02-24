// components/ShareButtons.tsx
'use client'
import { FiFacebook, FiTwitter, FiMail, FiLink, FiMessageCircle } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import toast from 'react-hot-toast'

type Props = {
  url: string
  title: string
  description?: string
}

export default function ShareButtons({ url, title, description }: Props) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description || '')

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
    } catch (error) {
      toast.error('Error al copiar enlace')
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold text-gray-700 mr-2">Compartir:</span>
      
      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white transition-colors"
        aria-label="Compartir en WhatsApp"
      >
        <FaWhatsapp className="text-xl" />
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg bg-[#1877F2] hover:bg-[#145DBF] text-white transition-colors"
        aria-label="Compartir en Facebook"
      >
        <FiFacebook className="text-xl" />
      </a>

      {/* Twitter/X */}
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg bg-black hover:bg-gray-800 text-white transition-colors"
        aria-label="Compartir en Twitter"
      >
        <FiTwitter className="text-xl" />
      </a>

      {/* Email */}
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`}
        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        aria-label="Compartir por email"
      >
        <FiMail className="text-xl" />
      </a>

      {/* Copy Link */}
      <button
        onClick={copyToClipboard}
        className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
        aria-label="Copiar enlace"
      >
        <FiLink className="text-xl" />
      </button>
    </div>
  )
}
