import React, { useState } from 'react'

// Sur mobile, si l'API Web Share existe, on l'utilise en priorité : elle
// ouvre le vrai menu de partage du téléphone, où Instagram, TikTok,
// Messages, etc. apparaissent automatiquement si installés — c'est la
// seule voie fiable pour ces deux plateformes, qui n'offrent aucune API
// de partage direct par URL. Sur desktop (où l'API n'existe pas), on
// retombe sur le menu de liens directs existant (WhatsApp/Facebook/X),
// avec "Copier le lien" en plus pour Instagram/TikTok (l'utilisateur
// colle ensuite lui-même dans une story ou une légende).
export default function ShareButton({ titre, url: urlProp, small }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const url = urlProp || (typeof window !== 'undefined' ? window.location.href : '')

  const canNativeShare = typeof navigator !== 'undefined' && navigator.share

  const handleNativeShare = async (e) => {
    e.stopPropagation()
    try {
      await navigator.share({ title: titre, text: titre, url })
    } catch (err) {
      // Annulation par l'utilisateur — pas une erreur à afficher.
    }
  }

  const handleCopyLink = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => { setCopied(false); setOpen(false) }, 1200)
    } catch (err) {
      console.error('Impossible de copier le lien :', err)
    }
  }

  const networks = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${titre} — ${url}`)}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8.9-.2.2-.3.2-.5.1-1.4-.7-2.3-1.2-3.2-2.8-.2-.4.2-.4.6-1.2.1-.2 0-.4 0-.5C10.2 9.7 9.8 8.7 9.6 8.3c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>
      ),
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z"/></svg>
      ),
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(titre)}&url=${encodeURIComponent(url)}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.5 8.6L23 22h-6.9l-5.4-6.6L4.4 22H1.3l8-9.2L1 2h7l4.9 6L18.9 2Zm-1.2 18h1.7L7.4 4H5.6l12.1 16Z"/></svg>
      ),
    },
  ]

  const shareLabelClass = small
    ? 'flex items-center gap-1.5 text-xs text-navy/50 hover:text-navy transition-colors'
    : 'flex items-center gap-1.5 text-xs text-navy/60 hover:text-navy transition-colors'

  if (canNativeShare) {
    return (
      <button onClick={handleNativeShare} className={shareLabelClass} aria-label="Partager">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
        </svg>
        Partager
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className={shareLabelClass}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.6" y1="10.5" x2="15.4" y2="6.5" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
        </svg>
        Partager
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-navy/10 py-1.5 z-20 min-w-[170px]"
        >
          {networks.map((n) => (
            
              key={n.name} href={n.href} target="_blank" rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-navy hover:bg-navy/5 transition-colors"
            >
              {n.icon} {n.name}
            </a>
          ))}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-navy hover:bg-navy/5 transition-colors text-left"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? 'Copié !' : 'Copier le lien (Instagram, TikTok…)'}
          </button>
        </div>
      )}
    </div>
  )
}
