export function formatToken(token: string): string {
  const compact = token.replace(/[\s-]/g, "")
  return /^\d{20}$/.test(compact) ? compact.match(/\d{4}/g)!.join("-") : token.trim()
}

/** One vend can carry several tokens, joined with commas by the parser. */
export function splitTokens(token: string): string[] {
  return token.split(",").map(formatToken).filter(Boolean)
}
