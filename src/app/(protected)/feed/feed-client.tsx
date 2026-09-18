"use client"

import { useState, useRef, useCallback } from "react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface Author { id: string; name: string | null; image: string | null }

interface Comment {
  id: string
  content: string
  createdAt: string
  author: Author
}

interface Post {
  id: string
  content: string
  imageUrl: string | null
  createdAt: string
  author: Author
  likes: { userId: string }[]
  _count: { comments: number }
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return "agora"
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

function PostCard({ post, currentUserId }: { post: Post; currentUserId: string }) {
  const likedByMe = post.likes.some((l) => l.userId === currentUserId)
  const [liked, setLiked] = useState(likedByMe)
  const [likeCount, setLikeCount] = useState(post.likes.length)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentCount, setCommentCount] = useState(post._count.comments)

  async function toggleLike() {
    setLiked((v) => !v)
    setLikeCount((c) => liked ? c - 1 : c + 1)
    await fetch(`/api/posts/${post.id}/like`, { method: "POST" })
  }

  async function loadComments() {
    if (!commentsLoaded) {
      const res = await fetch(`/api/posts/${post.id}/comments`)
      const data = await res.json()
      setComments(data)
      setCommentsLoaded(true)
    }
    setShowComments((v) => !v)
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentLoading(true)
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText.trim() }),
    })
    const newComment = await res.json()
    setComments((c) => [...c, newComment])
    setCommentText("")
    setCommentCount((c) => c + 1)
    setCommentLoading(false)
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Avatar name={post.author.name} image={post.author.image} size="sm" />
        <div className="flex-1 min-w-0">
          <span className="user-name text-sm font-semibold">{post.author.name}</span>
          <span className="text-xs text-[var(--muted)] ml-2">{timeAgo(post.createdAt)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>{post.content}</p>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="px-4 pb-3">
          <img
            src={post.imageUrl}
            alt=""
            className="w-full rounded-xl object-cover max-h-96"
            style={{ border: "1px solid var(--border)" }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 pb-3 border-t border-[var(--border)] pt-3">
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150 hover:bg-[var(--surface-2)] active:scale-95"
          style={{ color: liked ? "var(--primary)" : "var(--muted)" }}
        >
          <span className="text-base">{liked ? "★" : "☆"}</span>
          <span className="font-medium">{likeCount > 0 ? likeCount : ""}</span>
        </button>
        <button
          onClick={loadComments}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150 hover:bg-[var(--surface-2)]"
          style={{ color: showComments ? "var(--text)" : "var(--muted)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>{commentCount > 0 ? commentCount : ""}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-[var(--border)] px-4 py-3 space-y-3" style={{ background: "var(--surface-2)" }}>
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={c.author.name} image={c.author.image} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="rounded-xl px-3 py-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <span className="user-name text-xs font-semibold mr-2">{c.author.name}</span>
                  <span className="text-sm leading-relaxed">{c.content}</span>
                </div>
                <span className="text-[10px] text-[var(--muted)] pl-3 mt-0.5 block">{timeAgo(c.createdAt)}</span>
              </div>
            </div>
          ))}

          <form onSubmit={submitComment} className="flex gap-2 pt-1">
            <textarea
              placeholder="Escreva um comentário..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={1}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(e as unknown as React.FormEvent) } }}
              className="flex-1 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--primary)] transition-colors"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <Button type="submit" size="sm" loading={commentLoading} disabled={!commentText.trim()}>↑</Button>
          </form>
        </div>
      )}
    </div>
  )
}

function CreatePost({ currentUserName, currentUserImage, onPost }: { currentUserName: string; currentUserImage: string | null; onPost: (post: Post) => void }) {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert("Imagem muito grande. Máximo 2MB."); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImagePreview(result)
      setImageUrl(result)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, imageUrl: imageUrl || null }),
    })
    setLoading(false)
    if (!res.ok) return
    const post = await res.json()
    onPost(post)
    setContent("")
    setImageUrl("")
    setImagePreview(null)
    setExpanded(false)
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex gap-3">
        <Avatar name={currentUserName} image={currentUserImage} size="sm" />
        <div className="flex-1">
          <textarea
            placeholder="Compartilhe algo com a turma..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setExpanded(true)}
            rows={expanded ? 3 : 1}
            className="w-full bg-transparent text-sm resize-none focus:outline-none leading-relaxed"
            style={{ color: "var(--text)", caretColor: "var(--primary)" }}
          />

          {imagePreview && (
            <div className="relative mt-2 inline-block">
              <img src={imagePreview} alt="" className="max-h-48 rounded-xl object-cover" style={{ border: "1px solid var(--border)" }} />
              <button
                onClick={() => { setImagePreview(null); setImageUrl("") }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full text-xs flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
              >×</button>
            </div>
          )}

          {expanded && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                Foto
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <Button size="sm" loading={loading} disabled={!content.trim()} onClick={handleSubmit}>Publicar</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface FeedClientProps {
  initialPosts: Post[]
  nextCursor: string | null
  currentUserId: string
  currentUserName: string
  currentUserImage: string | null
}

export function FeedClient({ initialPosts, nextCursor: initCursor, currentUserId, currentUserName, currentUserImage }: FeedClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [cursor, setCursor] = useState<string | null>(initCursor)
  const [loadingMore, setLoadingMore] = useState(false)

  function prependPost(post: Post) {
    setPosts((p) => [post, ...p])
  }

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    const res = await fetch(`/api/posts?cursor=${cursor}`)
    const data = await res.json()
    setPosts((p) => [...p, ...data.posts])
    setCursor(data.nextCursor)
    setLoadingMore(false)
  }, [cursor, loadingMore])

  return (
    <div className="space-y-3">
      <CreatePost currentUserName={currentUserName} currentUserImage={currentUserImage} onPost={prependPost} />

      {posts.length === 0 && (
        <div className="py-16 text-center">
          <div className="text-5xl mb-4 opacity-20">✦</div>
          <p className="text-sm text-[var(--muted)]">Nenhuma publicação ainda. Seja o primeiro!</p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}

      {cursor && (
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" loading={loadingMore} onClick={loadMore}>
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  )
}
