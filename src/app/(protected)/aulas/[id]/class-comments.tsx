"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useMentionUsers, useMentionAutocomplete, MentionDropdown, MentionInput, highlightMentions } from "@/components/mention-autocomplete"

interface Author { id: string; name: string | null; image: string | null }
interface Comment {
  id: string
  content: string
  createdAt: string
  author: Author
  likes: { userId: string }[]
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

function LikeButton({ commentId, classId, initialLikes, currentUserId }: {
  commentId: string; classId: string; initialLikes: { userId: string }[]; currentUserId: string
}) {
  const [liked, setLiked] = useState(initialLikes.some((l) => l.userId === currentUserId))
  const [count, setCount] = useState(initialLikes.length)

  async function toggle() {
    setLiked((v) => !v)
    setCount((c) => liked ? c - 1 : c + 1)
    await fetch(`/api/classes/${classId}/comments/${commentId}/like`, { method: "POST" })
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

function CommentRow({ comment, classId, currentUserId, mentionMap, onDelete, onEdit }: {
  comment: Comment; classId: string; currentUserId: string; mentionMap: Record<string, string>; onDelete: (id: string) => void; onEdit: (id: string, content: string) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.content)
  const [saving, setSaving] = useState(false)
  const editRef = useRef<HTMLInputElement>(null)
  const { users: editUsers, load: loadEditUsers } = useMentionUsers()
  const { mentionQuery, selectMention, onKeyUp, caretCoords } = useMentionAutocomplete(editRef, editText, setEditText, loadEditUsers)

  async function handleSave() {
    const text = editText.trim()
    if (!text || text === comment.content) { setEditing(false); setEditText(comment.content); return }
    setSaving(true)
    const res = await fetch(`/api/classes/${classId}/comments/${comment.id}`, {
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
  const isAuthor = comment.author.id === currentUserId

  async function handleDelete() {
    if (!confirm("Excluir este comentário?")) return
    setDeleting(true)
    await fetch(`/api/classes/${classId}/comments/${comment.id}`, { method: "DELETE" })
    onDelete(comment.id)
  }

  return (
    <div className="flex gap-2.5">
      <Link href={`/perfil/${comment.author.id}`} className="flex-shrink-0">
        <Avatar name={comment.author.name} image={comment.author.image} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="rounded-xl px-3 py-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Link href={`/perfil/${comment.author.id}`} className="user-name text-xs font-semibold mr-2 hover:underline">
            {comment.author.name}
          </Link>
          {editing ? (
            <div className="relative mt-1">
              <MentionInput
                inputRef={editRef}
                value={editText}
                onChange={setEditText}
                autoFocus
                onFocus={loadEditUsers}
                onKeyUp={onKeyUp}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && mentionQuery === null) { e.preventDefault(); handleSave() }
                  if (e.key === "Escape") { setEditing(false); setEditText(comment.content) }
                }}
                className="rounded-lg"
              />
              {mentionQuery !== null && (
                <MentionDropdown users={editUsers} query={mentionQuery} onSelect={selectMention} caretCoords={caretCoords} />
              )}
            </div>
          ) : (
            <span className="text-sm leading-relaxed">{highlightMentions(comment.content, mentionMap)}</span>
          )}
        </div>
        <div className="flex items-center gap-3 pl-3 mt-1">
          <span className="text-[10px] text-[var(--muted)]">{timeAgo(comment.createdAt)}</span>
          <LikeButton commentId={comment.id} classId={classId} initialLikes={comment.likes} currentUserId={currentUserId} />
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

interface Props {
  classId: string
  currentUserId: string
  initialComments: Comment[]
  mentionMap?: Record<string, string>
}

export function ClassComments({ classId, currentUserId, initialComments, mentionMap = {} }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const { users, load: loadUsers } = useMentionUsers()
  const { mentionQuery, selectMention, onKeyUp, caretCoords } = useMentionAutocomplete(ref, text, setText, loadUsers)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    const res = await fetch(`/api/classes/${classId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim() }),
    })
    const newComment = await res.json()
    setComments((c) => [...c, newComment])
    setText("")
    setLoading(false)
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          Comentários {comments.length > 0 && <span className="font-normal text-[var(--muted)]">· {comments.length}</span>}
        </span>
      </div>

      <div className="px-4 py-3 space-y-3" style={{ background: "var(--surface-2)" }}>
        {comments.length === 0 && (
          <p className="text-sm text-[var(--muted)] text-center py-2">Nenhum comentário ainda. Seja o primeiro!</p>
        )}

        {comments.map((c) => (
          <CommentRow
            key={c.id}
            comment={c}
            classId={classId}
            currentUserId={currentUserId}
            mentionMap={mentionMap}
            onDelete={(id) => setComments((prev) => prev.filter((x) => x.id !== id))}
            onEdit={(id, content) => setComments((prev) => prev.map((x) => (x.id === id ? { ...x, content } : x)))}
          />
        ))}

        <form onSubmit={submit} className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <MentionInput
              inputRef={ref}
              placeholder="Escreva um comentário... (@nome para mencionar)"
              value={text}
              onChange={setText}
              onFocus={loadUsers}
              onKeyUp={onKeyUp}
              onKeyDown={(e) => {
                if (e.key === "Enter" && mentionQuery === null) {
                  e.preventDefault()
                  submit(e as unknown as React.FormEvent)
                }
              }}
              className="rounded-xl"
            />
            {mentionQuery !== null && (
              <MentionDropdown users={users} query={mentionQuery} onSelect={selectMention} caretCoords={caretCoords} />
            )}
          </div>
          <Button type="submit" size="sm" loading={loading} disabled={!text.trim()}>↑</Button>
        </form>
      </div>
    </div>
  )
}
