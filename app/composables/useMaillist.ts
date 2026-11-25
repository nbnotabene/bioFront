// Maillist sign-up through toolsapi's email service (https://tools.nbinfo.eu/email): open endpoints with
// double opt-in, so a sign-up only counts once the link in the confirmation mail is clicked.

export interface MaillistInfo {
  id: number
  name: string
  description: string | null
  url: string | null
}

// How a list is named to visitors: its description (e.g. "Svaneke Bio Nyhedsbrev"), else its name
export const maillistLabel = (list: MaillistInfo | null): string =>
  (list?.description || '').trim() || list?.name || 'nyhedsbrevet'

export function useMaillist () {
  const config = useRuntimeConfig()
  const base = String(config.public.email?.apiBase || 'https://tools.nbinfo.eu/email').replace(/\/+$/, '')

  const loadMaillist = (id: number | string) => $fetch<MaillistInfo>(`${base}/maillist/public/${id}`)

  // `website` is the form's hidden honeypot field (only bots fill it in)
  const subscribe = (id: number | string, email: string, website = '') =>
    $fetch<{ status: string }>(`${base}/maillist/${id}/subscribe`, { method: 'POST', body: { email, website } })

  return { loadMaillist, subscribe }
}
