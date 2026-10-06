export function rankWithTies<T extends { score: number }>(items: T[]): (T & { rank: number })[] {
  const sorted = [...items].sort((a, b) => b.score - a.score)
  const result: (T & { rank: number })[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (j < sorted.length && sorted[j].score === sorted[i].score) j++
    const group = sorted.slice(i, j)
    for (let k = group.length - 1; k > 0; k--) {
      const r = Math.floor(Math.random() * (k + 1))
      ;[group[k], group[r]] = [group[r], group[k]]
    }
    for (const item of group) result.push({ ...item, rank: i + 1 })
    i = j
  }
  return result
}
