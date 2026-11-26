/**
 * Hands out items from a list in shuffled order, so nothing repeats until the whole list
 * has been used, and the last one of a round never opens the next. Bags live for the whole
 * session (keyed by the list itself), so a joke heard on the desktop does not come back
 * the next time she returns there.
 */
const bags = new WeakMap<readonly unknown[], { left: number[]; last: number }>()

export function fresh<T>(list: readonly T[]): T {
  if (list.length < 2) return list[0]
  let b = bags.get(list)
  if (!b) bags.set(list, (b = { left: [], last: -1 }))
  if (!b.left.length) {
    b.left = list.map((_, i) => i)
    for (let i = b.left.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[b.left[i], b.left[j]] = [b.left[j], b.left[i]]
    }
    if (b.left[0] === b.last) b.left.push(b.left.shift()!)
  }
  b.last = b.left.shift()!
  return list[b.last]
}

const heard = new Set<string>()

/**
 * The full explanation the first time in a session, then a short, varied line.
 * Instructions she has already heard turn into noise when repeated every round.
 */
export function firstThen(key: string, full: string, after: readonly string[]): string {
  if (!heard.has(key)) {
    heard.add(key)
    return full
  }
  return fresh(after)
}
