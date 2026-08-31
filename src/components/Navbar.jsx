import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import AuthModal from './AuthModal'

const NAV_LINKS = [
  { label: 'Modules', href: '#services' },
  { label: 'Comment ça marche', href: '#comment' },
  { label: 'Communauté', href: '#communaute' },
]

export default function Navbar({ forceOpaque = false }) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Récupère la session en cours et écoute les changements (connexion/déconnexion)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    supabase.from('lvpt').select('is_admin').eq('id', user.id).single()
      .then(({ data }) => setIsAdmin(Boolean(data?.is_admin)))
  }, [user])

  // Ferme le menu si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const openAuthModal = (mode) => {
    setMenuOpen(false)
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const handleSignOut = async () => {
    setMenuOpen(false)
    await supabase.auth.signOut()
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || forceOpaque ? 'bg-cream/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Groupe de gauche : bouton hamburger (mobile) puis logo, dans
              cet ordre pour que le hamburger soit le premier élément
              tout à gauche du header. */}
          <div className="flex items-center gap-2">
            {/* Bouton hamburger — visible uniquement sous md. Sans lui, les
                liens "Modules"/"Comment ça marche"/"Communauté" (hidden md:flex)
                deviennent totalement inaccessibles sur mobile. Placé en
                premier dans ce groupe pour rester tout à gauche du header. */}
            <button
              onClick={() => setMobileNavOpen((open) => !open)}
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-navy hover:bg-navy/5 transition-colors"
              aria-label={mobileNavOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileNavOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>

            {/* Logo */}
            <a href="#" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-coral flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                </svg>
              </div>
              <span className="font-serif text-navy font-medium text-lg">Le Voyage Pour Tous</span>
            </a>
          </div>

          {/* Nav links — desktop uniquement */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="font-sans text-navy/70 hover:text-coral transition-colors text-sm">
                {link.label}
              </a>
            ))}
          </div>

          {/* Bouton principal / menu déroulant — reste à droite, seul le
              hamburger a été déplacé dans le groupe de gauche ci-dessus. */}
          <div className="relative" ref={menuRef}>
            {user ? (
              <div className="flex items-center rounded-full bg-coral overflow-hidden">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-sm py-2.5 pl-5 pr-2 flex items-center gap-2 text-white hover:bg-white/10 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-xs font-medium overflow-hidden">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (isAdmin ? 'A' : (user.user_metadata?.full_name || user.email || '?').charAt(0).toUpperCase())
                    )}
                  </div>
                  <span className="hidden sm:inline">{isAdmin ? 'Admin' : (user.user_metadata?.full_name?.split(' ')[0] || 'Mon compte')}</span>
                </button>
                <button
                  onClick={() => setMenuOpen((open) => !open)}
                  className="py-2.5 pl-1.5 pr-4 text-white hover:bg-white/10 transition-colors"
                  aria-label="Menu du compte"
                >
                  <ChevronIcon />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2 whitespace-nowrap"
              >
                Rejoindre l'aventure
                <ChevronIcon />
              </button>
            )}

            {/* Menu déroulant */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-navy/10 py-2 overflow-hidden">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-navy/60 truncate border-b border-navy/10 mb-1">
                      {user.email}
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/dashboard') }}
                      className="w-full text-left px-4 py-2 text-sm text-navy hover:bg-navy/5 transition-colors"
                    >
                      Vers le dashboard
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-navy hover:bg-navy/5 transition-colors"
                    >
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="w-full text-left px-4 py-2 text-sm text-navy hover:bg-navy/5 transition-colors"
                    >
                      Se connecter
                    </button>
                    <button
                      onClick={() => openAuthModal('signup')}
                      className="w-full text-left px-4 py-2 text-sm text-navy hover:bg-navy/5 transition-colors"
                    >
                      Créer un compte
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panneau mobile : mêmes liens que la version desktop, empilés */}
        {mobileNavOpen && (
          <div className="md:hidden bg-cream border-t border-navy/10 px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileNavOpen(false)}
                className="font-sans text-navy/70 hover:text-coral transition-colors text-sm py-2.5"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </nav>

      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} initialMode={authMode} />
      )}
    </>
  )
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
