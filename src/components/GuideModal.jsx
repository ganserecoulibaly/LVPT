import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { SECTIONS, PLAN_NAMES, COMING_SOON, EXAMPLE_POST, ADD_STEPS } from '../data/guideContent'

// Pop-up de bienvenue en 3 pages, affichée une seule fois à la première
// connexion (voir Dashboard.jsx). Le détail complet vit sur /guide.
const TOTAL = 3

function PlanGroup({ plan }) {
  const items = SECTIONS.filter((s) => s.plan === plan)
  return (
    <div className="mb-3">
      <p className="text-[11px] uppercase tracking-wide text-coral font-medium mb-1">{PLAN_NAMES[plan]}</p>
      <p className="text-sm text-navy/80 leading-relaxed">{items.map((s) => s.nom).join(' · ')}</p>
    </div>
  )
}

function PageRubriques() {
  return (
    <>
      <p className="font-serif text-lg text-navy mb-1">Bienvenue !</p>
      <p className="text-sm text-navy/55 mb-5">
        Voici les rubriques du site. Celles du plan Gratuit sont accessibles tout de suite, les autres se débloquent avec un abonnement.
      </p>
      <PlanGroup plan="free" />
      <PlanGroup plan="occasional" />
      <PlanGroup plan="frequent" />
      <p className="text-xs text-navy/45 mt-4">Bientôt : {COMING_SOON.join(', ')}.</p>
    </>
  )
}

function PageAjout() {
  return (
    <>
      <p className="font-serif text-lg text-navy mb-1">Ajouter du contenu</p>
      <p className="text-sm text-navy/55 mb-4">
        Dans toutes les rubriques, ça se passe de la même façon :
      </p>
      <ol className="text-sm text-navy/80 mb-4 flex flex-col gap-1.5">
        {ADD_STEPS.map((step, i) => (
          <li key={step} className="flex gap-2">
            <span className="shrink-0 w-5 h-5 rounded-full bg-coral/10 text-coral text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="rounded-xl bg-cream border border-navy/10 px-4 py-3">
        <p className="text-xs text-navy/50 mb-2">Exemple : « Ajouter un post Le Comptoir Voyage »</p>
        {EXAMPLE_POST.map(([label, value]) => (
          <p key={label} className="text-sm text-navy/80 leading-snug mb-1 last:mb-0">
            <span className="text-navy/50">{label} : </span>{value}
          </p>
        ))}
      </div>
    </>
  )
}

function PageAstuces({ onOpenGuide }) {
  return (
    <>
      <p className="font-serif text-lg text-navy mb-1">Bien démarrer</p>
      <p className="text-sm text-navy/55 mb-4">Quelques repères pour t’y retrouver.</p>
      <ul className="text-sm text-navy/80 flex flex-col gap-2.5 mb-5">
        <li><strong className="font-medium text-navy">Mes favoris</strong> : retrouve en un clic ce que tu as mis de côté.</li>
        <li><strong className="font-medium text-navy">Mes contenus</strong> (menu « Mon compte ») : modifie ou supprime ce que tu as publié.</li>
        <li><strong className="font-medium text-navy">Upgrade plan</strong> : débloque les rubriques avec un cadenas.</li>
        <li><strong className="font-medium text-navy">Guide du site</strong> (menu « Mon compte ») : retrouve cette aide, avec le détail de chaque rubrique.</li>
      </ul>
      <button onClick={onOpenGuide} className="text-sm text-coral hover:underline">
        Ouvrir le guide complet →
      </button>
    </>
  )
}

export default function GuideModal({ onClose }) {
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const isLast = page === TOTAL

  const openGuide = () => {
    onClose()
    navigate('/guide')
  }

  const modalContent = (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
      className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ height: 'fit-content' }}
        className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md relative m-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors"
          aria-label="Fermer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div style={{ minHeight: 330 }}>
          {page === 1 && <PageRubriques />}
          {page === 2 && <PageAjout />}
          {page === 3 && <PageAstuces onOpenGuide={openGuide} />}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => (page === 1 ? onClose() : setPage(page - 1))}
            className="text-xs text-navy/50 hover:text-navy transition-colors flex items-center gap-1 min-w-[64px]"
          >
            {page === 1 ? 'Passer' : (<><span aria-hidden="true">←</span> Retour</>)}
          </button>

          <span className="text-xs text-navy/50" aria-live="polite">{page}/{TOTAL}</span>

          {isLast ? (
            <button onClick={onClose} className="btn-primary text-sm py-2 px-5">C’est parti</button>
          ) : (
            <button
              onClick={() => setPage(page + 1)}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
              aria-label="Page suivante"
            >
              Suivant <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
