import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import AuthModal from './AuthModal'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [user, setUser] = useState(null)
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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-cream/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="font-sans text-navy/70 hover:text-coral transition-colors text-sm">Modules</a>
            <a href="#comment" className="font-sans text-navy/70 hover:text-coral transition-colors text-sm">Comment ça marche</a>
            <a href="#communaute" className="font-sans text-navy/70 hover:text-coral transition-colors text-sm">Communauté</a>
          </div>

          {/* Bouton principal / menu déroulant */}
          <div className="relative" ref={menuRef}>
            {user ? (
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-xs font-medium overflow-hidden">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user.user_metadata?.full_name || user.email || '?').charAt(0).toUpperCase()
                  )}
                </div>
                {user.user_metadata?.full_name?.split(' ')[0] || 'Mon compte'}
                <ChevronIcon />
              </button>
            ) : (
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
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
