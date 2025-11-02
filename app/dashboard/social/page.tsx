'use client'
import { useState, useEffect } from 'react'
import ProtectedClient from '@/app/auth/ProtectedClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { FiHeart, FiMessageCircle, FiShare2, FiTrendingUp, FiAward, FiHome, FiDollarSign, FiArrowLeft } from 'react-icons/fi'
import { getSession } from '@/lib/authSession'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Post {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  type: 'sale' | 'milestone' | 'listing' | 'achievement' | 'update'
  content: string
  image?: string
  likes: number
  comments: number
  timestamp: Date
  liked: boolean
}

export default function SocialFeedPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    loadFeed()
  }, [])

  async function loadFeed() {
    try {
      const session = await getSession()
      if (session?.uid) setCurrentUserId(session.uid)

      const res = await fetch('/api/social/feed')
      const data = await res.json()
      if (data.ok) setPosts(data.posts)
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading feed:', error)
      setLoading(false)
    }
  }

  async function handlePost() {
    if (!newPost.trim()) {
      toast.error('Escribe algo primero')
      return
    }

    try {
      const res = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPost,
          type: 'update'
        })
      })

      const data = await res.json()
      if (data.ok) {
        toast.success('Publicado!')
        setNewPost('')
        loadFeed()
      } else {
        toast.error(data.error || 'Error al publicar')
      }
    } catch (error) {
      toast.error('Error al publicar')
      console.error(error)
    }
  }

  async function handleLike(postId: string) {
    try {
      const res = await fetch('/api/social/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      })

      const data = await res.json()
      if (data.ok) {
        // Update local state
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked }
            : p
        ))
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const getPostIcon = (type: Post['type']) => {
    switch (type) {
      case 'sale': return <FiDollarSign className="text-green-600" />
      case 'listing': return <FiHome className="text-blue-600" />
      case 'achievement': return <FiAward className="text-yellow-600" />
      case 'milestone': return <FiTrendingUp className="text-purple-600" />
      default: return null
    }
  }

  const getPostBadgeColor = (type: Post['type']) => {
    switch (type) {
      case 'sale': return 'bg-green-100 text-green-800'
      case 'listing': return 'bg-blue-100 text-blue-800'
      case 'achievement': return 'bg-yellow-100 text-yellow-800'
      case 'milestone': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <ProtectedClient allowed={['agent', 'broker', 'brokerage_admin', 'master_admin']}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center">
          <div className="animate-pulse text-2xl font-bold text-[#004AAD]">Cargando feed...</div>
        </div>
      </ProtectedClient>
    )
  }

  return (
    <ProtectedClient allowed={['agent', 'broker', 'brokerage_admin', 'master_admin']}>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 pb-20">
        {/* Back Navigation */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <button 
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 text-[#004AAD] font-semibold hover:text-[#003d8f] transition-colors active:scale-95"
            >
              <FiArrowLeft className="text-xl" />
              <span>Volver al Dashboard</span>
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#004AAD] to-[#00A6A6] text-white py-12 px-4 mb-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">🌟 Comunidad VIVENTA</h1>
            <p className="text-blue-100">Comparte tus logros y celebra con el equipo</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 space-y-6">
          {/* Create Post */}
          <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in-up">
            <h2 className="text-xl font-bold mb-4">¿Qué está pasando?</h2>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Comparte una venta, un nuevo listing, o simplemente saluda..."
              className="w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-[#00A676] outline-none"
              rows={3}
            />
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {newPost.length}/500
              </div>
              <button
                onClick={handlePost}
                disabled={!newPost.trim()}
                className="px-6 py-3 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#009966] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                Publicar
              </button>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-4">
            {posts.map((post) => (
              <div 
                key={post.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all animate-fade-in-up"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold text-lg">
                      {post.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{post.userName}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(post.timestamp).toLocaleDateString('es-DO', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {post.type !== 'update' && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getPostBadgeColor(post.type)}`}>
                      {getPostIcon(post.type)}
                      {post.type === 'sale' && 'Venta'}
                      {post.type === 'listing' && 'Nuevo Listing'}
                      {post.type === 'achievement' && 'Logro'}
                      {post.type === 'milestone' && 'Hito'}
                    </span>
                  )}
                </div>

                {/* Content */}
                <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

                {/* Image */}
                {post.image && (
                  <img 
                    src={post.image} 
                    alt="Post image"
                    className="w-full rounded-xl mb-4 max-h-96 object-cover"
                  />
                )}

                {/* Actions */}
                <div className="flex items-center gap-6 pt-4 border-t">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 font-semibold transition-all hover:scale-110 ${
                      post.liked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                    }`}
                  >
                    <FiHeart className={`text-xl ${post.liked ? 'fill-current' : ''}`} />
                    <span>{post.likes}</span>
                  </button>
                  
                  <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-semibold transition-all hover:scale-110">
                    <FiMessageCircle className="text-xl" />
                    <span>{post.comments}</span>
                  </button>
                  
                  <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 font-semibold transition-all hover:scale-110">
                    <FiShare2 className="text-xl" />
                    <span>Compartir</span>
                  </button>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-3">📢</div>
                <p>Aún no hay publicaciones. ¡Sé el primero!</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </ProtectedClient>
  )
}
