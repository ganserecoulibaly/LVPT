import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const MAX_CREDITS = 5

function daysLeft(dateFin) {
  const diff = new Date(dateFin).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function FeatureVoting({ userId }) {
  const [round, setRound] = useState(null)
  const [ideas, setIdeas] = useState([])
  const [tallies, setTallies] = useState({}) // id_idee -> total tous users
  const [myVotes, setMyVotes] = useState({}) // id_idee -> mes votes
  const [authors, setAuthors] = useState({})
  const [loading, setLoading] = useState(true)

  const [proposeOpen, setProposeOpen] = useState(false)
  const [newTitre, setNewTitre] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [proposing, setProposing] = useState(false)
  const [proposeError, setProposeError] = useState(null)

  const loadAll = async () => {
    setLoading(true)

    const { data: roundData } = await supabase
      .from('feature_vote_round')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!roundData) {
      setRound(null)
      setLoading(false)
      return
    }
    setRound(roundData)

    if (roundData.statut !== 'ouvert') {
      setLoading(false)
      return
    }

    const { data: ideaRows } = await supabase
      .from('s_feature_idee')
      .select('*')
      .eq('id_round', roundData.id_round)
      .order('created_at', { ascending: true })
    const list = ideaRows || []
    setIdeas(list)

    const ideaIds = list.map((i) => i.id_idee)
    if (ideaIds.length > 0) {
      const { data: voteRows } = await supabase
        .from('feature_vote')
        .select('id_idee, pid, nb_votes')
        .in('id_idee', ideaIds)

      const tallyMap = {}
      const mineMap = {}
      ;(voteRows || []).forEach((v) => {
        tallyMap[v.id_idee] = (tallyMap[v.id_idee] || 0) + v.nb_votes
        if (v.pid === userId) mineMap[v.id_idee] = v.nb_votes
      })
      setTallies(tallyMap)
      setMyVotes(mineMap)
    }

    const pids = [...new Set(list.map((i) => i.pid))]
    if (pids.length) {
      const { data: profiles } = await supabase.from('public_profiles').select('id, prenom').in('id', pids)
      setAuthors(Object.fromEntries((profiles || []).map((p) => [p.id, p.prenom || 'Un voyageur'])))
    }

    setLoading(false)
  }

  useEffect(() => { loadAll() }, [userId])

  const mySpent = Object.values(myVotes).reduce((sum, n) => sum + n, 0)
  const remaining = MAX_CREDITS - mySpent
  const maxTally = Math.max(1, ...Object.values(tallies))

  const changeVote = async (idIdee, delta) => {
    const current = myVotes[idIdee] || 0
    const next = current + delta
    if (next < 0) return
    if (delta > 0 && remaining <= 0) return

    // Mise à jour optimiste
    setMyVotes((m) => ({ ...m, [idIdee]: next }))
    setTallies((t) => ({ ...t, [idIdee]: (t[idIdee] || 0) + delta }))

    const { error } = await supabase.from('feature_vote').upsert(
      { pid: userId, id_idee: idIdee, nb_votes: next },
      { onConflict: 'pid,id_idee' }
    )
    if (error) {
      // Le trigger a refusé (limite de 5 dépassée) : on annule l'optimisme.
      console.error('Erreur vote fonctionnalité:', error.message)
      setMyVotes((m) => ({ ...m, [idIdee]: current }))
      setTallies((t) => ({ ...t, [idIdee]: (t[idIdee] || 0) - delta }))
    }
  }

  const submitIdea = async () => {
    setProposeError(null)
    if (!newTitre.trim()) {
      setProposeError('Donne un titre à ton idée.')
      return
    }
    setProposing(true)
    const { error } = await supabase.from('s_feature_idee').insert({
      id_round: round.id_round,
      pid: userId,
      titre: newTitre.trim(),
      description: newDescription.trim() || null,
    })
    if (error) {
      setProposeError(error.message)
      setProposing(false)
      return
    }
    setNewTitre('')
    setNewDescription('')
    setProposeOpen(false)
    setProposing(false)
    await loadAll()
  }

  if (loading || !round) return null

  const sortedIdeas = [...ideas].sort((a, b) => (tallies[b.id_idee] || 0) - (tallies[a.id_idee] || 0))
  const leaderId = sortedIdeas[0]?.id_idee

  return (
    <div className="mb-10">
      {round.statut === 'en_developpement' ? (
        <>
          <p className="font-serif text-lg text-navy mb-4">Vote pour la prochaine fonctionnalité</p>
          <div className="bg-white border border-navy/10 rounded-xl p-6 text-center">
            <div className="w-9 h-9 rounded-full bg-coral/15 flex items-center justify-center mx-auto mb-3">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#712B13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 1.4 0l1.6-1.6a1 1 0 0 1 1.4 1.4l-1.6 1.6a1 1 0 0 0 0 1.4l1.9 1.9a1 1 0 0 1 0 1.4l-8.6 8.6a1 1 0 0 1-1.4 0l-1.9-1.9a1 1 0 0 0-1.4 0l-1.6 1.6a1 1 0 0 1-1.4-1.4l1.6-1.6a1 1 0 0 0 0-1.4l-1.9-1.9a1 1 0 0 1 0-1.4l8.6-8.6a1 1 0 0 1 1.4 0Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-navy mb-1">
              {round.titre_gagnant || 'La prochaine fonctionnalité'} arrive bientôt
            </p>
            <p className="text-xs text-navy/55">
              La fonctionnalité gagnante est en cours de développement — les votes rouvriront à sa livraison.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3 mb-1">
            <p className="font-serif font-bold text-lg text-navy">Vote pour la prochaine fonctionnalité</p>
            <span className="bg-navy/5 text-navy/70 text-xs px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
              {daysLeft(round.date_fin)}j restants
            </span>
          </div>
          <p className="text-xs text-navy/55 mb-3">
            5 votes à répartir comme tu veux, rechangeables à tout moment jusqu'à la clôture.
          </p>

          <div className="flex items-center justify-between bg-coral/10 rounded-lg px-3 py-2 mb-4">
            <span className="text-xs text-[#712B13]">
              Il te reste <span className="font-medium">{remaining} vote{remaining > 1 ? 's' : ''}</span> sur {MAX_CREDITS}
            </span>
            <button
              onClick={() => setProposeOpen((o) => !o)}
              className="bg-white border border-navy/15 rounded-full px-3 py-1.5 text-xs font-medium text-navy hover:bg-navy/5 transition-colors"
            >
              + Proposer une idée
            </button>
          </div>

          {proposeOpen && (
            <div className="bg-white border border-navy/10 rounded-xl p-4 mb-4">
              <input
                value={newTitre} onChange={(e) => setNewTitre(e.target.value)}
                placeholder="Titre de ton idée"
                className="w-full px-3 py-2 border border-navy/15 rounded-lg text-sm mb-2 focus:outline-none focus:border-coral"
              />
              <textarea
                value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Décris-la en quelques mots (facultatif)"
                rows={2}
                className="w-full px-3 py-2 border border-navy/15 rounded-lg text-sm mb-2 focus:outline-none focus:border-coral resize-none"
              />
              {proposeError && <p className="text-xs text-red-500 mb-2">{proposeError}</p>}
              <button
                onClick={submitIdea}
                disabled={proposing}
                className="btn-primary text-xs py-2 px-4 disabled:opacity-60"
              >
                {proposing ? 'Envoi…' : 'Publier'}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {sortedIdeas.length === 0 ? (
              <p className="text-xs text-navy/40">Aucune idée proposée pour l'instant — sois le premier.</p>
            ) : (
              sortedIdeas.map((idea) => {
                const total = tallies[idea.id_idee] || 0
                const mine = myVotes[idea.id_idee] || 0
                const isLeader = idea.id_idee === leaderId && total > 0
                const widthPct = Math.round((total / maxTally) * 100)
                return (
                  <div
                    key={idea.id_idee}
                    className={`bg-white rounded-xl p-3 ${isLeader ? 'border border-coral' : 'border border-navy/10'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-navy">{idea.titre}</p>
                        {isLeader && (
                          <span className="bg-coral/10 text-[#712B13] text-[10px] px-2 py-0.5 rounded-md">En tête</span>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${isLeader ? 'text-coral' : 'text-navy/55'}`}>
                        {total} vote{total > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="bg-navy/5 rounded h-2 overflow-hidden mb-2">
                      <div
                        className="h-full rounded"
                        style={{ width: `${widthPct}%`, backgroundColor: isLeader ? '#D85A30' : '#B4B2A9' }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-navy/45 flex-1">
                        Proposé par {authors[idea.pid] || 'Un voyageur'}
                        {idea.description ? ` — ${idea.description}` : ''}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => changeVote(idea.id_idee, -1)}
                          disabled={mine === 0}
                          className="w-6 h-6 rounded-full border border-navy/15 flex items-center justify-center text-navy disabled:opacity-30 disabled:cursor-not-allowed hover:bg-navy/5 transition-colors"
                          style={{ lineHeight: 1 }}
                          aria-label="Retirer un vote"
                        >
                          −
                        </button>
                        <span className="text-[11px] text-navy/55 min-w-[42px] text-center">
                          {mine} vote{mine > 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => changeVote(idea.id_idee, 1)}
                          disabled={remaining <= 0}
                          className="w-6 h-6 rounded-full bg-coral text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-coral/90 transition-colors"
                          style={{ lineHeight: 1 }}
                          aria-label="Ajouter un vote"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
