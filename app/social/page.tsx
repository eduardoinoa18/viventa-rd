'use client'
import { useEffect, useState } from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { getSession } from '../../lib/authSession'
import { FiVideo, FiHome, FiMessageCircle, FiHeart, FiSend, FiPlus } from 'react-icons/fi'

type Post = {
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

export default function SocialFeedPage() {
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
  const isPro = session && ['agent','broker','admin','master_admin'].includes(session.role)

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

  useEffect(() => { load() }, [])

  async function like(postId: string) {
    try {
      const res = await fetch('/api/social/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId }) })
      const data = await res.json()
      if (data.ok) load()
    } catch {}
  }

  async function comment(postId: string, content: string, input: HTMLInputElement) {
    if (!content.trim()) return
    try {
      const res = await fetch('/api/social/comment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, text: content }) })
      const data = await res.json()
      if (data.ok) { input.value = ''; load() }
    } catch {}
  }

  async function createPost(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, text, videoUrl, listingId, listingTitle })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Error')
      setComposerOpen(false); setTitle(''); setVideoUrl(''); setText(''); setListingId(''); setListingTitle('')
      load()
    } catch (err: any) {
      setError(err.message || 'No se pudo publicar')
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Social</h1>
          {isPro && (
            <button onClick={()=>setComposerOpen(v=>!v)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00A6A6] text-white font-semibold hover:bg-[#008f8f]"><FiPlus /> Compartir</button>
          )}
        </div>

        {composerOpen && isPro && (
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <form onSubmit={createPost} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-medium text-gray-700">Tipo
                  <select value={type} onChange={e=>setType(e.target.value as any)} className="block w-full border rounded px-2 py-2 mt-1">
                    <option value="video">Video corto</option>
                    <option value="listing">Compartir listing</option>
                    <option value="text">Texto</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700">Título
                  <input value={title} onChange={e=>setTitle(e.target.value)} className="block w-full border rounded px-2 py-2 mt-1" placeholder="Título (opcional)" />
                </label>
              </div>
              {type === 'video' && (
                <label className="text-sm font-medium text-gray-700">URL de video (MP4 / YouTube)
                  <input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} className="block w-full border rounded px-2 py-2 mt-1" placeholder="https://..." />
                </label>
              )}
              {type === 'listing' && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-medium text-gray-700">ID del listing
                    <input value={listingId} onChange={e=>setListingId(e.target.value)} className="block w-full border rounded px-2 py-2 mt-1" placeholder="ID" />
                  </label>
                  <label className="text-sm font-medium text-gray-700">Título del listing
                    <input value={listingTitle} onChange={e=>setListingTitle(e.target.value)} className="block w-full border rounded px-2 py-2 mt-1" placeholder="Título visible" />
                  </label>
                </div>
              )}
              {type === 'text' && (
                <label className="text-sm font-medium text-gray-700">Contenido
                  <textarea value={text} onChange={e=>setText(e.target.value)} className="block w-full border rounded px-2 py-2 mt-1" rows={3} maxLength={500} placeholder="Comparte una actualización" />
                </label>
              )}
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex items-center gap-2">
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#0B2545] text-white font-semibold">Publicar</button>
                <button type="button" onClick={()=>setComposerOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : (
          <div className="space-y-4">
            {posts.map(p => (
              <article key={p.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span className="font-semibold text-gray-800">{p.authorRole === 'user' ? 'Usuario' : p.authorName}</span>
                  <span>•</span>
                  <span className="uppercase text-xs bg-gray-100 px-2 py-0.5 rounded">{p.type}</span>
                </div>
                {p.title && <h2 className="font-bold text-gray-800 mb-2">{p.title}</h2>}
                {p.type === 'video' && p.videoUrl && (
                  <div className="rounded-lg overflow-hidden bg-black aspect-video mb-2">
                    {p.videoUrl.includes('youtube.com') || p.videoUrl.includes('youtu.be') ? (
                      <iframe className="w-full h-full" src={p.videoUrl.replace('watch?v=','embed/')} title={p.title || 'video'} allowFullScreen />
                    ) : (
                      <video className="w-full h-full" controls src={p.videoUrl} />
                    )}
                  </div>
                )}
                {p.type === 'listing' && (
                  <a className="block p-3 rounded border hover:bg-gray-50" href={p.listingId ? `/listing/${p.listingId}` : '#'}>
                    <div className="flex items-center gap-2 text-[#004AAD]"><FiHome /> Ver listing {p.listingTitle ? `– ${p.listingTitle}` : ''}</div>
                  </a>
                )}
                {p.type === 'text' && p.text && (
                  <p className="text-gray-700 whitespace-pre-wrap">{p.text}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <button onClick={()=>like(p.id)} className="inline-flex items-center gap-1 hover:text-[#00A6A6]"><FiHeart /> {p.likesCount}</button>
                  <div className="inline-flex items-center gap-1"><FiMessageCircle /> {p.commentsCount}</div>
                </div>
                {session && (
                  <div className="mt-3 flex items-center gap-2">
                    <input placeholder="Escribe un comentario" className="flex-1 border rounded px-3 py-2" onKeyDown={(e)=>{
                      if (e.key === 'Enter') {
                        comment(p.id, (e.target as HTMLInputElement).value, e.target as HTMLInputElement)
                      }
                    }} />
                    <button onClick={()=>{
                      const input = (document.activeElement as HTMLInputElement)
                      if (input && input.tagName === 'INPUT') comment(p.id, input.value, input)
                    }} className="px-3 py-2 rounded bg-[#00A6A6] text-white"><FiSend /></button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
