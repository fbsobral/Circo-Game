"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { compressImage, CommentImageButton, CommentImagePreview, CommentPhoto } from "@/components/comment-image"
import { highlightMentions, MentionInput, MentionDropdown, useMentionUsers, useMentionAutocomplete } from "@/components/mention-autocomplete"

interface Author { id: string; name: string | null; image: string | null }

interface Comment {
  id: string
  content: string
  imageUrl?: string | null
  createdAt: string
  author: Author
  likes: { userId: string }[]
}

interface LikeWithUser { userId: string; user: { id: string; name: string | null; image: string | null } }

interface Post {
  id: string
  content: string
  imageUrl: string | null
  createdAt: string
  author: Author
  likes: LikeWithUser[]
  _count: { comments: number }
  recentComments?: Comment[]
  mentionMap?: Record<string, string>
}

function timeAgo(date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return "agora"
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}

function IconEdit() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function IconImage() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}

function IconSmile() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 13s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  )
}

function IconComment() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  { label: "Recentes", emojis: [] },
  { label: "😀 Rostos", emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","☺️","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","💫","🤯","🤠","🥸","🤓","🧐","😕","🫤","😟","🙁","☹️","😮","😯","😲","😳","🥺","🫣","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"] },
  { label: "👋 Gestos", emojis: ["👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","🫷","🫸","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃","👀","🫦","🧠","🦷","🦴","👣"] },
  { label: "🐶 Animais", emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪲","🦟","🦗","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🦭","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🐈","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🦔"] },
  { label: "🌱 Natureza", emojis: ["🌵","🎄","🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎍","🎋","🪴","🍃","🍂","🍁","🍄","🌾","💐","🌷","🌹","🥀","🪻","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜","🌚","🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","🌙","🌟","⭐","🌠","☀️","🌤️","⛅","🌥️","☁️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","☃️","⛄","🌬️","🌀","🌈","⚡","🌊","🌫️","💧","💦","🔥"] },
  { label: "🍎 Comida", emojis: ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍑","🍒","🥭","🍍","🥥","🥝","🍅","🫒","🥑","🍆","🥦","🥬","🥒","🌶️","🧄","🧅","🥕","🌽","🥗","🥙","🧆","🥚","🍳","🥘","🍲","🌯","🌮","🥪","🧀","🍞","🥐","🥖","🧇","🥞","🧈","🍱","🍣","🍜","🍝","🍛","🍚","🍙","🍘","🥟","🦪","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🍵","🧃","🥤","🧋","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾"] },
  { label: "⚽ Esportes", emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🥍","🏑","🏏","⛳","🎣","🤿","🎽","🎿","🛷","🥌","🥊","🥋","⛸️","🛼","🎯","🎳","🏹","⛷️","🏂","🪂","🏋️","🤼","🤺","🤸","⛹️","🏌️","🏇","🧘","🏄","🚣","🧗","🚵","🚴","🤾","🏆","🥇","🥈","🥉","🎖️","🏅","🎪","🎭","🎨","🎰","🎲","🧩","🎮","🕹️","🎸","🎺","🎻","🥁","🎷","🎤","🎧","🎼","🎬","🎥"] },
  { label: "✈️ Viagem", emojis: ["🚗","🚕","🚙","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🛵","🏍️","🚲","🛴","🛹","🚏","⛽","🚨","🚥","🚦","🛑","🚤","⛵","🛶","🚢","✈️","🛫","🛬","🪂","💺","🚁","🛸","🚀","🛰️","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏟️","🏛️","🏗️","🏘️","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌","🛕","⛩️"] },
  { label: "💡 Objetos", emojis: ["📱","💻","🖥️","⌨️","🖱️","💽","💾","💿","📀","🎥","📽️","📺","📷","📹","📼","🔋","🔌","💡","🔦","🕯️","🧯","🛢️","💸","💵","💳","💎","⚖️","🧰","🔧","🔨","⛏️","🛠️","🗡️","⚔️","🛡️","🪚","🔩","🔫","🏹","🧱","🛏️","🛋️","🚪","🧴","🧹","🧺","🧻","🚿","🛁","🧼","🪒","🧽","🛒","🎁","📦","📬","📝","📎","📏","📐","✂️","🔒","🔓","🔑","🗝️","🔗","🧲","🪞","🪟","🧸","🎎","🎐","🎀","🎗️","🎟️","🎫","📡","🔭","🔬","💊","💉","🩹","🩺","🧬"] },
  { label: "❤️ Símbolos", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","⭐","🌟","✨","💫","🔥","💥","❄️","🌈","🎵","🎶","🔔","🔕","🔇","🔊","📣","📢","🔞","📵","🚫","💯","❌","✅","❎","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🔺","🔻","⬛","⬜","♾️","♻️","✔️","☑️","⚜️","🔰","🔄","⏩","⏪","▶️","⏸️","🆕","🆓","🆒","🆗","🆙","🆚","🆘","🔝","🔛","🔜","🔙"] },
]

const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap(c => c.emojis)

function useFlipUp(ref: React.RefObject<HTMLDivElement | null>, extraHeight = 0) {
  const [flipUp, setFlipUp] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const totalBottom = rect.top + rect.height + extraHeight
    if (totalBottom > window.innerHeight - 8) setFlipUp(true)
    else setFlipUp(false)
  }, [ref, extraHeight])
  return flipUp
}

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState(1)
  const flipUp = useFlipUp(ref, 340)

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("touchstart", handler)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("touchstart", handler)
    }
  }, [onClose])

  const filtered = query.trim()
    ? ALL_EMOJIS.filter(e => e.includes(query.trim()))
    : EMOJI_CATEGORIES[activeCategory]?.emojis ?? []

  return (
    <div
      ref={ref}
      className="absolute z-50 rounded-2xl shadow-xl flex flex-col"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        ...(flipUp ? { bottom: "100%", marginBottom: 4 } : { top: "100%", marginTop: 4 }),
        left: 0,
        width: "min(320px, calc(100vw - 24px))",
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* search */}
      <div className="p-2 pb-0">
        <input
          type="text"
          placeholder="Buscar emoji..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-sm outline-none"
          style={{
            fontSize: 16,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>

      {/* category tabs */}
      {!query.trim() && (
        <div className="flex gap-1 px-2 pt-2 overflow-x-auto scrollbar-none">
          {EMOJI_CATEGORIES.slice(1).map((cat, i) => (
            <button
              key={cat.label}
              type="button"
              onClick={() => setActiveCategory(i + 1)}
              className="text-base flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: activeCategory === i + 1 ? "var(--primary)" : "transparent",
              }}
              title={cat.label}
            >
              {cat.emojis[0]}
            </button>
          ))}
        </div>
      )}

      {/* grid */}
      <div className="overflow-y-auto p-2" style={{ maxHeight: 240 }}>
        {filtered.length === 0 ? (
          <p className="text-center text-sm py-4" style={{ color: "var(--muted-foreground)" }}>Nenhum resultado</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {filtered.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                type="button"
                onClick={() => { onSelect(emoji); onClose() }}
                className="text-xl rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors active:scale-90"
                style={{ width: 36, height: 36, flexShrink: 0 }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function useEmojiInsert(ref: React.RefObject<HTMLTextAreaElement | null>, setValue: (v: string) => void) {
  return (emoji: string) => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const newVal = el.value.slice(0, start) + emoji + el.value.slice(end)
    setValue(newVal)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }
}

function CommentLikeButton({ commentId, initialLikes, currentUserId }: { commentId: string; initialLikes: { userId: string }[]; currentUserId: string }) {
  const [liked, setLiked] = useState(initialLikes.some((l) => l.userId === currentUserId))
  const [count, setCount] = useState(initialLikes.length)

  async function toggle() {
    setLiked((v) => !v)
    setCount((c) => liked ? c - 1 : c + 1)
    await fetch(`/api/posts/_/comments/${commentId}/like`, { method: "POST" })
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1 text-[10px] transition-colors"
      style={{ color: liked ? "var(--danger, #e05c7a)" : "var(--muted)" }}
    >
      <IconHeart filled={liked} />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}

function CommentRow({ comment, postId, currentUserId, mentionMap, onDelete, onEdit }: {
  comment: Comment
  postId: string
  currentUserId: string
  mentionMap?: Record<string, string>
  onDelete: (id: string) => void
  onEdit: (id: string, content: string) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [saving, setSaving] = useState(false)
  const editRef = useRef<HTMLInputElement>(null)
  const { users: editUsers, load: loadEditUsers } = useMentionUsers()
  const mention = useMentionAutocomplete(editRef, editText, setEditText, editUsers, loadEditUsers)
  const isAuthor = comment.author.id === currentUserId

  async function handleSave() {
    const text = editText.trim()
    if ((!text && !comment.imageUrl) || text === comment.content) { setEditing(false); setEditText(comment.content); return }
    setSaving(true)
    const res = await fetch(`/api/posts/${postId}/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    })
    setSaving(false)
    if (res.ok) {
      onEdit(comment.id, text)
      setEditing(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Excluir este comentário?")) return
    setDeleting(true)
    await fetch(`/api/posts/${postId}/comments/${comment.id}`, { method: "DELETE" })
    onDelete(comment.id)
  }

  return (
    <div className="flex gap-2.5">
      <Link href={`/perfil/${comment.author.id}`} className="flex-shrink-0">
        <Avatar name={comment.author.name} image={comment.author.image} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="rounded-xl px-3 py-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Link href={`/perfil/${comment.author.id}`} className="user-name text-xs font-semibold mr-2 hover:underline">{comment.author.name}</Link>
          {editing ? (
            <div className="relative mt-1">
              <MentionInput
                inputRef={editRef}
                value={editText}
                onChange={setEditText}
                autoFocus
                onFocus={loadEditUsers}
                onKeyUp={mention.onKeyUp}
                onKeyDown={(e) => {
                  if (mention.onKeyDown(e)) return
                  if (e.key === "Enter") { e.preventDefault(); handleSave() }
                  if (e.key === "Escape") { setEditing(false); setEditText(comment.content) }
                }}
                className="rounded-lg"
              />
              <MentionDropdown mention={mention} />
            </div>
          ) : (
            <>
              {comment.content && <span className="text-sm leading-relaxed">{highlightMentions(comment.content, mentionMap)}</span>}
              {comment.imageUrl && <div><CommentPhoto src={comment.imageUrl} /></div>}
            </>
          )}
        </div>
        <div className="flex items-center gap-3 pl-3 mt-1">
          <span className="text-[10px] text-[var(--muted)]">{timeAgo(comment.createdAt)}</span>
          <CommentLikeButton commentId={comment.id} initialLikes={comment.likes} currentUserId={currentUserId} />
          {isAuthor && editing && (
            <>
              <button onClick={handleSave} disabled={saving} className="text-[10px] text-[var(--primary)]">salvar</button>
              <button onClick={() => { setEditing(false); setEditText(comment.content) }} className="text-[10px]" style={{ color: "var(--muted)" }}>cancelar</button>
            </>
          )}
          {isAuthor && !editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-[10px] transition-colors hover:text-[var(--primary)]"
                style={{ color: "var(--muted)" }}
              >
                editar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[10px] transition-colors hover:text-[var(--danger,#e05c7a)]"
                style={{ color: "var(--muted)" }}
              >
                excluir
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function PostCard({ post, currentUserId, onDelete, onEdit }: {
  post: Post
  currentUserId: string
  onDelete: (id: string) => void
  onEdit: (id: string, content: string) => void
}) {
  const likedByMe = post.likes.some((l) => l.userId === currentUserId)
  const [liked, setLiked] = useState(likedByMe)
  const [likeCount, setLikeCount] = useState(post.likes.length)
  const hasRecent = (post.recentComments?.length ?? 0) > 0
  const [showComments, setShowComments] = useState(hasRecent)
  const [comments, setComments] = useState<Comment[]>(post.recentComments ?? [])
  const [commentsLoaded, setCommentsLoaded] = useState(hasRecent && post._count.comments <= (post.recentComments?.length ?? 0))
  const [loadingAll, setLoadingAll] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentImage, setCommentImage] = useState<string | null>(null)
  const commentRef = useRef<HTMLInputElement>(null)
  const { users: commentUsers, load: loadCommentUsers } = useMentionUsers()
  const commentMention = useMentionAutocomplete(commentRef, commentText, setCommentText, commentUsers, loadCommentUsers)
  const [commentCount, setCommentCount] = useState(post._count.comments)
  const [deleting, setDeleting] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)
  const [showLikers, setShowLikers] = useState(false)
  const [likers, setLikers] = useState<{ id: string; name: string | null; image: string | null }[] | null>(null)

  const [linkCopied, setLinkCopied] = useState(false)

  async function copyLink() {
    const url = `${window.location.origin}/post/${post.id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const input = document.createElement("textarea")
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
    }
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  async function openLikers() {
    setShowLikers(true)
    if (!likers) {
      const res = await fetch(`/api/posts/${post.id}/like`)
      if (res.ok) setLikers(await res.json())
    }
  }

  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editLoading, setEditLoading] = useState(false)
  const [showEditEmoji, setShowEditEmoji] = useState(false)
  const editRef = useRef<HTMLTextAreaElement>(null)
  const insertEditEmoji = useEmojiInsert(editRef, setEditContent)
  const { users: editUsers, load: loadEditUsers } = useMentionUsers()
  const editMention = useMentionAutocomplete(editRef, editContent, setEditContent, editUsers, loadEditUsers)

  const images = post.imageUrl ? post.imageUrl.split("|||") : []
  const isAuthor = post.author.id === currentUserId

  async function toggleLike() {
    setLiked((v) => !v)
    setLikeCount((c) => liked ? c - 1 : c + 1)
    await fetch(`/api/posts/${post.id}/like`, { method: "POST" })
  }

  async function loadAllComments() {
    setLoadingAll(true)
    const res = await fetch(`/api/posts/${post.id}/comments`)
    if (res.ok) {
      setComments(await res.json())
      setCommentsLoaded(true)
    }
    setLoadingAll(false)
  }

  async function loadComments() {
    if (showComments) { setShowComments(false); return }
    setShowComments(true)
    if (!commentsLoaded) await loadAllComments()
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim() && !commentImage) return
    setCommentLoading(true)
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText.trim(), imageUrl: commentImage }),
    })
    if (!res.ok) { setCommentLoading(false); return }
    const newComment = await res.json()
    setComments((c) => [...c, newComment])
    setCommentText("")
    setCommentImage(null)
    setCommentCount((c) => c + 1)
    setCommentLoading(false)
  }

  async function handleDelete() {
    if (!confirm("Excluir este post?")) return
    setDeleting(true)
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" })
    onDelete(post.id)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editContent.trim() || editContent.trim() === post.content) { setEditing(false); return }
    setEditLoading(true)
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent.trim() }),
    })
    setEditLoading(false)
    if (res.ok) {
      onEdit(post.id, editContent.trim())
      setEditing(false)
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href={`/perfil/${post.author.id}`} className="flex-shrink-0">
          <Avatar name={post.author.name} image={post.author.image} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/perfil/${post.author.id}`} className="user-name text-sm font-semibold hover:underline">{post.author.name}</Link>
          <span className="text-xs text-[var(--muted)] ml-2">{timeAgo(post.createdAt)}</span>
        </div>
        {isAuthor && !editing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setEditing(true); setEditContent(post.content); setTimeout(() => editRef.current?.focus(), 50) }}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--primary)]"
            >
              <IconEdit />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--danger,#e05c7a)]"
            >
              <IconTrash />
            </button>
          </div>
        )}
      </div>

      {/* Content / Edit mode */}
      <div className="px-4 pb-3">
        {editing ? (
          <form onSubmit={handleEdit} className="space-y-2">
            <div className="relative">
              <textarea
                ref={editRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onFocus={loadEditUsers}
                onKeyUp={editMention.onKeyUp}
                onKeyDown={(e) => { editMention.onKeyDown(e) }}
                rows={4}
                className="w-full rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--primary)] transition-colors"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "16px" }}
              />
              <MentionDropdown mention={editMention} />
              {showEditEmoji && (
                <EmojiPicker onSelect={insertEditEmoji} onClose={() => setShowEditEmoji(false)} />
              )}
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowEditEmoji((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
              >
                <IconSmile />
                Emoji
              </button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" type="button" onClick={() => { setEditing(false); setShowEditEmoji(false) }}>Cancelar</Button>
                <Button size="sm" type="submit" loading={editLoading} disabled={!editContent.trim()}>Salvar</Button>
              </div>
            </div>
          </form>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>{highlightMentions(post.content, post.mentionMap)}</p>
        )}
      </div>

      {/* Images */}
      {!editing && images.length > 0 && (
        <div className="px-4 pb-3">
          <div className="relative">
            <img
              src={images[imageIndex]}
              alt=""
              className="w-full rounded-xl object-cover max-h-96"
              style={{ border: "1px solid var(--border)" }}
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 right-2 flex gap-1">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIndex(i)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{ background: i === imageIndex ? "white" : "rgba(255,255,255,0.4)" }}
                  />
                ))}
              </div>
            )}
            {images.length > 1 && imageIndex < images.length - 1 && (
              <button
                onClick={() => setImageIndex((i) => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{ background: "rgba(0,0,0,0.45)" }}
              >›</button>
            )}
            {images.length > 1 && imageIndex > 0 && (
              <button
                onClick={() => setImageIndex((i) => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                style={{ background: "rgba(0,0,0,0.45)" }}
              >‹</button>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button key={i} onClick={() => setImageIndex(i)} className="flex-shrink-0">
                  <img
                    src={src}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover transition-all"
                    style={{ border: `1px solid ${i === imageIndex ? "var(--primary)" : "var(--border)"}`, opacity: i === imageIndex ? 1 : 0.6 }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Likers summary bar */}
      {likeCount > 0 && !editing && (
        <div className="px-4 pt-2 pb-1 flex items-center gap-2">
          <button onClick={openLikers} className="flex items-center gap-2 group">
            <div className="flex -space-x-1.5">
              {post.likes.slice(0, 3).map((l) => (
                <div key={l.userId} className="w-5 h-5 rounded-full ring-1 ring-[var(--surface)] overflow-hidden flex-shrink-0"
                  style={{ background: "var(--surface-2)" }}>
                  {l.user.image
                    ? <img src={l.user.image} alt={l.user.name ?? ""} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold" style={{ color: "var(--primary)" }}>
                        {(l.user.name ?? "?")[0].toUpperCase()}
                      </div>
                  }
                </div>
              ))}
            </div>
            <span className="text-xs group-hover:underline transition-colors" style={{ color: "var(--muted)" }}>
              {likeCount === 1 ? "1 curtida" : `${likeCount} curtidas`}
            </span>
          </button>
        </div>
      )}

      {/* Likers modal */}
      {showLikers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowLikers(false)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="font-semibold" style={{ color: "var(--text)" }}>Curtidas</span>
              <button onClick={() => setShowLikers(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors text-lg leading-none"
                style={{ color: "var(--muted)" }}>×</button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {likers === null ? (
                <div className="px-4 py-6 text-sm text-center" style={{ color: "var(--muted)" }}>Carregando...</div>
              ) : likers.length === 0 ? (
                <div className="px-4 py-6 text-sm text-center" style={{ color: "var(--muted)" }}>Ninguém ainda</div>
              ) : likers.map((u) => (
                <Link key={u.id} href={`/perfil/${u.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition-colors"
                  style={{ color: "var(--text)" }}
                  onClick={() => setShowLikers(false)}>
                  <Avatar name={u.name} image={u.image} size="md" />
                  <span className="text-sm font-medium">{u.name ?? "Usuário"}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {!editing && (
        <div className="flex items-center gap-1 px-3 pb-3 border-t border-[var(--border)] pt-3">
          <button
            onClick={toggleLike}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150 hover:bg-[var(--surface-2)] active:scale-95"
            style={{ color: liked ? "var(--danger, #e05c7a)" : "var(--muted)" }}
          >
            <IconHeart filled={liked} />
            <span className="font-medium">Curtir</span>
          </button>
          <button
            onClick={loadComments}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150 hover:bg-[var(--surface-2)]"
            style={{ color: showComments ? "var(--text)" : "var(--muted)" }}
          >
            <IconComment />
            <span>{commentCount > 0 ? commentCount : ""}</span>
          </button>
          <button
            onClick={copyLink}
            title="Copiar link do post"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150 hover:bg-[var(--surface-2)]"
            style={{ color: linkCopied ? "var(--primary)" : "var(--muted)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>{linkCopied ? "Link copiado" : "Copiar link"}</span>
          </button>
        </div>
      )}

      {/* Comments */}
      {showComments && !editing && (
        <div className="border-t border-[var(--border)] px-4 py-3 space-y-3" style={{ background: "var(--surface-2)" }}>
          {!commentsLoaded && commentCount > comments.length && (
            <button
              onClick={loadAllComments}
              disabled={loadingAll}
              className="text-xs font-medium hover:underline"
              style={{ color: "var(--muted)" }}
            >
              {loadingAll ? "Carregando..." : `Ver todos os ${commentCount} comentários`}
            </button>
          )}
          {comments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              postId={post.id}
              currentUserId={currentUserId}
              mentionMap={post.mentionMap}
              onDelete={(id) => {
                setComments((prev) => prev.filter((x) => x.id !== id))
                setCommentCount((n) => n - 1)
              }}
              onEdit={(id, content) => setComments((prev) => prev.map((x) => (x.id === id ? { ...x, content } : x)))}
            />
          ))}

          <form onSubmit={submitComment} className="space-y-2 pt-1">
            {commentImage && <CommentImagePreview src={commentImage} onRemove={() => setCommentImage(null)} />}
            <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MentionInput
                inputRef={commentRef}
                placeholder="Escreva um comentário..."
                value={commentText}
                onChange={setCommentText}
                onFocus={loadCommentUsers}
                onKeyUp={commentMention.onKeyUp}
                onKeyDown={(e) => {
                  if (commentMention.onKeyDown(e)) return
                  if (e.key === "Enter") {
                    e.preventDefault()
                    submitComment(e as unknown as React.FormEvent)
                  }
                }}
                className="rounded-xl"
              />
              <MentionDropdown mention={commentMention} />
            </div>
            <CommentImageButton onPick={setCommentImage} />
            <Button type="submit" size="sm" loading={commentLoading} disabled={!commentText.trim() && !commentImage}>↑</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function CreatePost({ currentUserName, currentUserImage, onPost }: { currentUserName: string; currentUserImage: string | null; onPost: (post: Post) => void }) {
  const [content, setContent] = useState("")
  const [previews, setPreviews] = useState<string[]>([])
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const insertEmoji = useEmojiInsert(textareaRef, setContent)
  const { users, load: loadUsers } = useMentionUsers()
  const mention = useMentionAutocomplete(textareaRef, content, setContent, users, loadUsers)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const compressed = await Promise.all(files.map((f) => compressImage(f)))
    setPreviews((p) => [...p, ...compressed])
    setImages((imgs) => [...imgs, ...compressed])
  }

  function removeImage(i: number) {
    setPreviews((p) => p.filter((_, idx) => idx !== i))
    setImages((imgs) => imgs.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, imageUrl: images.length ? images.join("|||") : null }),
    })
    setLoading(false)
    if (!res.ok) return
    const post = await res.json()
    onPost(post)
    setContent("")
    setPreviews([])
    setImages([])
    setExpanded(false)
    setShowEmoji(false)
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex gap-3">
        <Avatar name={currentUserName} image={currentUserImage} size="sm" />
        <div className="flex-1">
          <div className="relative">
            {/* Textarea: text is invisible; caret and placeholder remain visible */}
            <textarea
              ref={textareaRef}
              placeholder="Compartilhe algo com a turma..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => { setExpanded(true); loadUsers() }}
              onKeyUp={mention.onKeyUp}
              onKeyDown={(e) => { mention.onKeyDown(e) }}
              rows={expanded ? 3 : 1}
              className="w-full bg-transparent text-sm resize-none focus:outline-none leading-relaxed placeholder:text-[var(--muted)]"
              style={{ color: "transparent", caretColor: "var(--text)", fontSize: "16px" }}
            />
            {/* Overlay on top (declared after textarea → naturally higher in stacking order) */}
            <div
              aria-hidden
              className="absolute inset-0 text-sm leading-relaxed pointer-events-none select-none overflow-hidden whitespace-pre-wrap break-words"
              style={{ fontSize: "16px", padding: "2px 0" }}
            >
              {highlightMentions(content, {}, true)}
            </div>
            <MentionDropdown mention={mention} />
          </div>

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover" style={{ border: "1px solid var(--border)" }} />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {expanded && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmoji((v) => !v)}
                      className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                    >
                      <IconSmile />
                      Emoji
                    </button>
                    {showEmoji && (
                      <EmojiPicker onSelect={(e) => { insertEmoji(e); setShowEmoji(false) }} onClose={() => setShowEmoji(false)} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    <IconImage />
                    Fotos
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                </div>
                <Button size="sm" loading={loading} disabled={!content.trim()} onClick={handleSubmit}>Publicar</Button>
              </div>
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
  singlePost?: boolean
}

export function FeedClient({ initialPosts, nextCursor: initCursor, currentUserId, currentUserName, currentUserImage, singlePost = false }: FeedClientProps) {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  useEffect(() => {
    const match = window.location.hash.match(/^#post-(.+)$/)
    if (match && !singlePost) router.replace(`/post/${match[1]}`)
  }, [router, singlePost])
  const [cursor, setCursor] = useState<string | null>(initCursor)
  const [loadingMore, setLoadingMore] = useState(false)

  function prependPost(post: Post) {
    setPosts((p) => [post, ...p])
  }

  function removePost(id: string) {
    if (singlePost) { router.push("/feed"); return }
    setPosts((p) => p.filter((post) => post.id !== id))
  }

  function editPost(id: string, content: string) {
    setPosts((p) => p.map((post) => post.id === id ? { ...post, content } : post))
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
      {!singlePost && <CreatePost currentUserName={currentUserName} currentUserImage={currentUserImage} onPost={prependPost} />}

      {posts.length === 0 && (
        <div className="py-16 text-center">
          <div className="text-5xl mb-4 opacity-20">✦</div>
          <p className="text-sm text-[var(--muted)]">Nenhuma publicação ainda. Seja o primeiro!</p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} onDelete={removePost} onEdit={editPost} />
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
