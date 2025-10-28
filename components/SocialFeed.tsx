'use client'
import { useEffect, useState } from 'react'
import { getSession } from '@/lib/authSession'
import { FiVideo, FiHome, FiMessageCircle, FiHeart, FiSend, FiPlus } from 'react-icons/fi'

export type Post = {
  id: string
  type: 'video' | 'listing' | 'text'
  title?: string | null
  text?: string | null
  videoUrl?: string | null
  listingId?: string | null
  listingTitle?: string | null
  authorId: string
  authorName: string
  authorRole: string
  likesCount: number
  commentsCount: number
  createdAt?: any
}

export default function SocialFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [type, setType] = useState<'video' | 'listing' | 'text'>('video')
  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [text, setText] = useState('')
  const [listingId, setListingId] = useState('')
  const [listingTitle, setListingTitle] = useState('')

  const session = typeof window !== 'undefined' ? getSession() : null
  const canPost = session && session.role === 'master_admin' // temporarily restrict posting

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/social/posts', { cache: 'no-store' })
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (e: any) {
      setError('No se pudo cargar el feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handlePost() {
    if (!session) return
    const body: any = { type }
    if (type === 'video' && videoUrl) body.videoUrl = videoUrl
    if (type === 'listing' && listingId && listingTitle) {
      body.listingId = listingId
      body.listingTitle = listingTitle
    }
    if (type === 'text' && text) body.text = text
    if (title) body.title = title
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        setComposerOpen(false)
        setTitle('')
        setVideoUrl('')
        setText('')
        setListingId('')
        setListingTitle('')
        load()
      }
    } catch (e) {
      alert('Error al publicar')
    }
  }

  async function handleLike(postId: string) {
    if (!session) return
    try {
      await fetch('/api/social/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      })
      load()
    } catch {}
  }

  async function handleComment(postId: string, commentText: string) {
    if (!session || !commentText.trim()) return
    try {
      await fetch('/api/social/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, text: commentText })
      })
      load()
    } catch {}
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Feed Social</h1>
        {canPost && (
          <button
            onClick={() => setComposerOpen(!composerOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <FiPlus /> Publicar
          </button>
        )}
      </div>

      {/* Limited access banner */}
      <div className="mb-6 text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        Vista temprana: por ahora solo el Master Admin puede publicar. Todos los usuarios pueden ver, dar like y comentar.
      </div>

      {/* Composer */}
      {canPost && composerOpen && (
        <div className="mb-6 bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setType('video')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${type === 'video' ? 'bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <FiVideo className="inline mr-2" />Video
            </button>
            <button
              onClick={() => setType('listing')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${type === 'listing' ? 'bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <FiHome className="inline mr-2" />Listado
            </button>
            <button
              onClick={() => setType('text')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold transition-all ${type === 'text' ? 'bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <FiMessageCircle className="inline mr-2" />Texto
            </button>
          </div>
          <input
            type="text"
            placeholder="Título (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg"
          />
          {type === 'video' && (
            <input
              type="text"
              placeholder="URL del video (YouTube, Vimeo, etc.)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg"
            />
          )}
          {type === 'listing' && (
            <>
              <input
                type="text"
                placeholder="ID del Listado"
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Título del Listado"
                value={listingTitle}
                onChange={(e) => setListingTitle(e.target.value)}
                className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg"
              />
            </>
          )}
          {type === 'text' && (
            <textarea
              placeholder="¿Qué quieres compartir?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          )}
          <button
            onClick={handlePost}
            className="w-full py-2 bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <FiSend className="inline mr-2" />Publicar
          </button>
        </div>
      )}

      {/* Posts */}
      {loading && <p className="text-center text-gray-500 py-8">Cargando...</p>}
      {error && <p className="text-center text-red-600 py-8">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="text-center text-gray-500 py-8">No hay publicaciones aún</p>
      )}
      {posts.map(post => (
        <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} />
      ))}
    </main>
  )
}

function PostCard({ post, onLike, onComment }: { post: Post; onLike: (id: string) => void; onComment: (id: string, text: string) => void }) {
  const [commentText, setCommentText] = useState('')
  return (
    <div className="bg-white rounded-lg shadow mb-4 overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-[#0B2545] to-[#00A676] rounded-full flex items-center justify-center text-white font-bold text-lg">
          {post.authorName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{post.authorName}</p>
          <p className="text-sm text-gray-500">{post.authorRole}</p>
        </div>
      </div>
      {/* Title */}
      {post.title && <p className="px-4 pb-2 font-semibold text-gray-900">{post.title}</p>}
      {/* Content */}
      {post.type === 'video' && post.videoUrl && (
        <div className="bg-black aspect-video">
          <iframe
            src={post.videoUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {post.type === 'listing' && post.listingId && (
        <div className="bg-gradient-to-br from-blue-50 to-teal-50 p-4 mx-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">📍 Propiedad Destacada</p>
          <p className="font-bold text-[#0B2545]">{post.listingTitle || 'Ver Propiedad'}</p>
          <a
            href={`/listing/${post.listingId}`}
            className="inline-block mt-2 px-4 py-2 bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
          >
            Ver Detalles
          </a>
        </div>
      )}
      {post.type === 'text' && post.text && (
        <p className="px-4 pb-4 text-gray-700 whitespace-pre-wrap">{post.text}</p>
      )}
      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center gap-4">
        <button
          onClick={() => onLike(post.id)}
          className="flex items-center gap-2 text-gray-700 hover:text-red-500 transition-colors"
        >
          <FiHeart className={post.likesCount > 0 ? 'fill-current text-red-500' : ''} />
          <span className="text-sm font-semibold">{post.likesCount}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-700 hover:text-[#00A676] transition-colors">
          <FiMessageCircle />
          <span className="text-sm font-semibold">{post.commentsCount}</span>
        </button>
      </div>
      {/* Comment input */}
      <div className="px-4 pb-4 flex gap-2">
        <input
          type="text"
          placeholder="Escribe un comentario..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => {
            if ((e as any).key === 'Enter' && commentText.trim()) {
              onComment(post.id, commentText)
              setCommentText('')
            }
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <button
          onClick={() => {
            if (commentText.trim()) {
              onComment(post.id, commentText)
              setCommentText('')
            }
          }}
          className="px-4 py-2 bg-gradient-to-r from-[#0B2545] to-[#00A676] text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
        >
          <FiSend />
        </button>
      </div>
    </div>
  )
}
