// components/ImageGalleryCarousel.tsx
'use client'
import { useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiX, FiMaximize2 } from 'react-icons/fi'
import Image from 'next/image'

type Props = {
  images: string[]
  title: string
}

export default function ImageGalleryCarousel({ images, title }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-xl">
        <span className="text-gray-500">No hay imágenes disponibles</span>
      </div>
    )
  }

  const next = () => setCurrentIndex((currentIndex + 1) % images.length)
  const prev = () => setCurrentIndex((currentIndex - 1 + images.length) % images.length)
  
  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setShowLightbox(true)
  }

  const nextLightbox = () => setLightboxIndex((lightboxIndex + 1) % images.length)
  const prevLightbox = () => setLightboxIndex((lightboxIndex - 1 + images.length) % images.length)

  return (
    <>
      {/* Main Gallery */}
      <div className="relative">
        {/* Main Image */}
        <div className="relative h-96 md:h-[500px] rounded-xl overflow-hidden bg-gray-900 group">
          <img
            src={images[currentIndex]}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => openLightbox(currentIndex)}
          />
          
          {/* Expand Button */}
          <button
            onClick={() => openLightbox(currentIndex)}
            className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-all backdrop-blur-sm"
            aria-label="Ver en pantalla completa"
          >
            <FiMaximize2 className="text-xl" />
          </button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
                aria-label="Imagen anterior"
              >
                <FiChevronLeft className="text-2xl" />
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
                aria-label="Siguiente imagen"
              >
                <FiChevronRight className="text-2xl" />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 text-white rounded-full text-sm backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail Grid */}
        {images.length > 1 && (
          <div className="mt-4 grid grid-cols-5 md:grid-cols-8 gap-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  currentIndex === idx
                    ? 'border-[#00A676] ring-2 ring-[#00A676]/30'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10"
            aria-label="Cerrar"
          >
            <FiX className="text-2xl" />
          </button>

          <button
            onClick={prevLightbox}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10"
            aria-label="Anterior"
          >
            <FiChevronLeft className="text-3xl" />
          </button>

          <button
            onClick={nextLightbox}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10"
            aria-label="Siguiente"
          >
            <FiChevronRight className="text-3xl" />
          </button>

          <img
            src={images[lightboxIndex]}
            alt={`${title} - ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/70 text-white rounded-full text-lg backdrop-blur-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}
