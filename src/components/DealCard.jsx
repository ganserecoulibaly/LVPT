import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

const NAVY = [27, 42, 65]
const CORAL = [216, 90, 48]
const BLUE = [59, 130, 246]
const MAX_MAGNITUDE = 10

// Types dont la carte doit ouvrir une vraie page de détail interne au clic
// (itinéraire, post Voyage commun, plat du carnet gastro) plutôt que de
// rester statique. Les autres types (vol, hébergement, activité, lieu,
// spa) n'ont pas de fiche de détail dédiée — leur bouton "Voir l'offre"
// (lien externe) reste le seul point d'action, la carte elle-même
// n'est pas cliquable pour eux.
const DETAIL_ROUTES = {
  itineraire: function (id) { return '/itineraires/' + id },
  voyage_commun: function (id) { return '/voyage-commun/' + id },
  plat: function (id) { return '/carnet-gastronomique/' + id },
}

function mix(colorA, colorB, t) {
  return colorA.map(function (c, i) {
    return Math.round(c + (colorB[i] - c) * t)
  })
}

function getCounterColor(value) {
  const intensity = Math.min(Math.abs(value) / MAX_MAGNITUDE, 1)
  const target = value > 0 ? CORAL : value < 0 ? BLUE : NAVY
  const mixed = mix(NAVY, target, intensity)
  const r = mixed[0]
  const g = mixed[1]
  const b = mixed[2]
  return 'rgb(' + r + ', ' + g + ', ' + b + ')'
}

function HeartIcon(props) {
  const filled = props.filled
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? '#D85A30' : 'none'} stroke={filled ? '#D85A30' : 'white'} strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  )
}

// deal doit contenir : id, type ('vol' | 'hebergement' | 'activite' | 'itineraire' | 'voyage_commun' | 'plat' | 'lieu' | 'spa'), title, price, date, emoji, fallbackGradient, image?, sharedBy?
export default function DealCard(props) {
  const deal = props.deal
  const userId = props.userId
  const isFavorite = props.isFavorite
  const onToggleFavorite = props.onToggleFavorite

  const navigate = useNavigate()
  const [aggregateScore, setAggregateScore] = useState(0)
  const [myVote, setMyVote] = useState(null) // -1 | 1 | null
  const color = getCounterColor(aggregateScore)

  const detailRouteBuilder = DETAIL_ROUTES[deal.type]
  const detailRoute = detailRouteBuilder ? detailRouteBuilder(deal.id) : null

  useEffect(function () {
    function loadVotes() {
      // La policy "votes_select_all" autorise à voir tous les votes,
      // ce qui permet de calculer le score agrégé en une seule requête.
      supabase
        .from('votes')
        .select('pid, score')
        .eq('nom', deal.type)
        .eq('id_entite', deal.id)
        .then(function (res) {
          const data = res.data
          if (!data) return
          let total = 0
          data.forEach(function (v) { total += v.score })
          setAggregateScore(total)
          const mine = data.find(function (v) { return v.pid === userId })
          setMyVote(mine ? mine.score : null)
        })
    }
    if (deal && deal.id && deal.type) loadVotes()
  }, [deal ? deal.id : null, deal ? deal.type : null, userId])

  function castVote(value) {
    if (!userId) return

    if (myVote !== null) {
      // Un vote existe déjà : on le retire, peu importe le bouton cliqué.
      // Il faudra recliquer pour poser un nouveau vote dans l'autre sens.
      supabase.from('votes').delete().eq('pid', userId).eq('id_entite', deal.id).eq('nom', deal.type).then(function () {
        setAggregateScore(function (s) { return s - myVote })
        setMyVote(null)
      })
      return
    }

    // Aucun vote existant : on enregistre le nouveau
    supabase
      .from('votes')
      .upsert(
        { pid: userId, id_entite: deal.id, nom: deal.type, score: value },
        { onConflict: 'pid,id_entite,nom' }
      )
      .then(function () {
        setAggregateScore(function (s) { return s + value })
        setMyVote(value)
      })
  }

  function handleCardClick() {
    if (detailRoute) navigate(detailRoute)
  }

  function handleFavoriteClick(e) {
    e.stopPropagation()
    if (onToggleFavorite) onToggleFavorite(deal)
  }

  function handleLinkClick(e) {
    e.stopPropagation()
  }

  function handleVoteDown(e) {
    e.stopPropagation()
    castVote(-1)
  }

  function handleVoteUp(e) {
    e.stopPropagation()
    castVote(1)
  }

  const cardClassName = 'rounded-xl overflow-hidden bg-white border border-navy/10' + (detailRoute ? ' cursor-pointer hover:border-navy/20 transition-colors' : '')

  return (
    <div onClick={handleCardClick} className={cardClassName}>
      <div className="relative">
        {deal.image ? (
          <img src={deal.image} alt={deal.title} className="w-full h-28 object-cover" />
        ) : (
          <div className={'w-full h-28 bg-gradient-to-br ' + (deal.fallbackGradient || 'from-navy/20 to-navy/5') + ' flex items-center justify-center'}>
            <span className="text-2xl">{deal.emoji || '✈️'}</span>
          </div>
        )}

        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-navy/30 backdrop-blur-sm flex items-center justify-center hover:bg-navy/45 transition-colors"
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <HeartIcon filled={isFavorite} />
        </button>
      </div>

      <div className="p-4">
        {deal.sharedBy && (
          <p className="text-[11px] text-coral font-medium mb-1.5">Partagé par {deal.sharedBy}</p>
        )}
        <p className="text-sm font-medium text-navy mb-0.5">{deal.title}</p>
        {deal.date && <p className="text-xs text-navy/45 mb-2">{deal.date}</p>}
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-lg font-serif text-coral">{deal.price}</p>
          {deal.link && (
            <a
              href={deal.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkClick}
              className="text-xs text-coral hover:underline shrink-0 ml-2"
            >
              Voir l'offre ↗
            </a>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVoteDown}
            className={'w-7 h-7 rounded-full border flex items-center justify-center transition-colors shrink-0 ' + (myVote === -1 ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-navy/15 text-navy/60 hover:bg-navy/5')}
            aria-label="Moins bon plan"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          <span
            className="text-sm font-semibold w-8 text-center tabular-nums transition-colors duration-200"
            style={{ color: color }}
          >
            {aggregateScore > 0 ? '+' + aggregateScore : aggregateScore}
          </span>

          <button
            onClick={handleVoteUp}
            className={'w-7 h-7 rounded-full border flex items-center justify-center transition-colors shrink-0 ' + (myVote === 1 ? 'border-coral bg-coral/10 text-coral' : 'border-navy/15 text-navy/60 hover:bg-navy/5')}
            aria-label="Bon plan"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
