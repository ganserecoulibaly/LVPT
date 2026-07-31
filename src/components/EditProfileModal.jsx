import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from './supabaseClient'
import AirportAutocomplete from './AirportAutocomplete'

// Réutilisée pour deux usages :
// - ouverture manuelle via le bouton "Modifier le profil" (PageHeader)
// - ouverture automatique à la première connexion, si le compte vient
//   d'une inscription Google (champs jamais remplis) — voir Dashboard.jsx
//
// firstTime : true quand la modale s'ouvre automatiquement. Change juste
// le texte d'intro et le libellé du bouton de fermeture, pas la logique.
export default function EditProfileModal({ userId, onClose, firstTime = false }) {
  const [loading, setLoading] = useState(true)
  const [hasPassword, setHasPassword] = useState(false)

  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [villeDepartFav, setVilleDepartFav] = useState('')
  const [paysDepartFav, setPaysDepartFav] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: profile }, { data: { user } }] = await Promise.all([
        supabase.from('lvpt').select('prenom, nom, telephone, ville_depart_fav, pays_depart_fav').eq('id', userId).single(),
        supabase.auth.getUser(),
      ])
      if (profile) {
        setPrenom(profile.prenom || '')
        setNom(profile.nom || '')
        setTelephone(profile.telephone || '')
        setVilleDepartFav(profile.ville_depart_fav || '')
        setPaysDepartFav(profile.pays_depart_fav || '')
      }
      // Un compte connecté uniquement via Google n'a pas de mot de passe —
      // proposer d'en changer un n'aurait pas de sens pour lui.
      const hasEmailIdentity = user?.identities?.some((i) => i.provider === 'email')
      setHasPassword(Boolean(hasEmailIdentity))
      setLoading(false)
    }
    load()
  }, [userId])

  const handleClose = async () => {
    if (firstTime) {
      // Peu importe si le user a rempli ou non : on ne montre plus jamais
      // cette popup automatique après sa première apparition.
      await supabase.from('lvpt').update({ profil_a_completer_vu: true }).eq('id', userId)
    }
    onClose()
  }

  // Anonymise plutôt que supprime réellement la ligne : plusieurs tables
  // (s_voyage_commun, voyage_commun_commentaire, feature_vote,
  // s_feature_idee) ont "on delete cascade" vers lvpt(id) — une vraie
  // suppression effacerait aussi tout le contenu créé par la personne,
  // ce qu'on ne veut pas. La ligne reste, ses champs personnels sont
  // vidés, et "Compte supprimé" s'affiche automatiquement partout via
  // la vue public_profiles.
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Supprimer ton compte ? Ton profil sera anonymisé (nom, email, téléphone effacés) et tu seras déconnecté. Cette action est irréversible.\n\nLes itinéraires et posts que tu as publiés resteront visibles, mais affichés comme provenant d'un « Compte supprimé »."
    )
    if (!confirmed) return

    setDeleting(true)
    const { error: deleteError } = await supabase
      .from('lvpt')
      .update({
        prenom: null,
        nom: null,
        telephone: null,
        email: null,
        ville_depart_fav: null,
        pays_depart_fav: null,
        compte_supprime: true,
      })
      .eq('id', userId)

    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }

    await supabase.auth.signOut()
    // Rechargement complet plutôt qu'une navigation React Router : le
    // compte vient de disparaître fonctionnellement, on repart de zéro
    // proprement plutôt que de risquer un état incohérent dans l'app.
    window.location.href = '/'
  }

  const handleSubmit = async () => {
    setError(null)

    if (!villeDepartFav) {
      setError('Merci de choisir ton aéroport de départ dans la liste proposée.')
      return
    }

    if (hasPassword && (newPassword || confirmPassword)) {
      if (newPassword.length < 6) {
        setError('Le nouveau mot de passe doit faire au moins 6 caractères.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.')
        return
      }
    }

    setSaving(true)

    const { error: profileError } = await supabase
      .from('lvpt')
      .update({
        prenom: prenom.trim(),
        nom: nom.trim(),
        telephone: telephone.trim() || null,
        // AirportAutocomplete renvoie "Ville (CODE)" — même normalisation
        // que AuthModal.jsx à l'inscription, pour rester cohérent avec
        // d_vol.aeroport_depart.
        ville_depart_fav: villeDepartFav.split(' (')[0].trim(),
        pays_depart_fav: paysDepartFav || null,
      })
      .eq('id', userId)

    if (profileError) {
      setError(profileError.message)
      setSaving(false)
      return
    }

    if (hasPassword && newPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword })
      if (passwordError) {
        setError(passwordError.message)
        setSaving(false)
        return
      }
    }

    if (firstTime) {
      await supabase.from('lvpt').update({ profil_a_completer_vu: true }).eq('id', userId)
    }

    setSaving(false)
    setSuccess(true)
    setTimeout(() => onClose(), 1200)
  }

  const inputClass =
    'w-full px-3 py-2.5 border border-navy/15 rounded-lg text-sm focus:outline-none focus:border-coral'

  const modalContent = (
    <div
      onClick={handleClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
      className="flex justify-center overflow-y-auto bg-navy/45 px-4 py-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ height: 'fit-content' }}
        className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm relative m-auto"
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-navy/40 hover:text-navy transition-colors"
          aria-label="Fermer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {loading ? (
          <div className="py-10 text-center text-sm text-navy/40">Chargement…</div>
        ) : success ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12l5 5L20 6" />
              </svg>
            </div>
            <p className="font-serif text-lg text-navy">Profil mis à jour</p>
          </div>
        ) : (
          <>
            <p className="font-serif text-lg text-navy text-center mb-1">
              {firstTime ? 'Complète ton profil' : 'Modifier le profil'}
            </p>
            <p className="text-sm text-navy/55 text-center mb-6">
              {firstTime
                ? "Quelques infos pour personnaliser ton expérience — tu peux passer cette étape et y revenir plus tard."
                : 'Mets à jour tes informations personnelles.'}
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-navy/50 mb-1 block">Prénom</label>
                <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-navy/50 mb-1 block">Nom</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-navy/50 mb-1 block">Téléphone (facultatif)</label>
                <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="06 12 34 56 78" className={inputClass} />
              </div>

              <AirportAutocomplete
                label="Aéroport de départ favori"
                placeholder="Paris (CDG)"
                value={villeDepartFav}
                onChange={(val) => setVilleDepartFav(val)}
                onSelectAirport={(airport) => setPaysDepartFav(airport.country)}
                required
              />

              {hasPassword && (
                <>
                  <div className="flex items-center gap-2 mt-2 mb-1">
                    <div className="flex-1 h-px bg-navy/10" />
                    <span className="text-xs text-navy/40">changer le mot de passe (facultatif)</span>
                    <div className="flex-1 h-px bg-navy/10" />
                  </div>
                  <div>
                    <label className="text-xs text-navy/50 mb-1 block">Nouveau mot de passe</label>
                    <input
                      type="password" minLength={6} value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Laisser vide pour ne pas changer" className={inputClass}
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-navy/50 mb-1 block">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password" minLength={6} value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirmer" className={inputClass}
                      autoComplete="new-password"
                    />
                  </div>
                </>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary w-full text-sm py-2.5 mt-1 disabled:opacity-60 flex items-center justify-center text-center"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>

              {firstTime && (
                <button
                  onClick={handleClose}
                  className="text-xs text-navy/50 hover:text-navy transition-colors text-center mt-1"
                >
                  Plus tard
                </button>
              )}

              {!firstTime && (
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="text-xs text-navy/40 hover:text-red-500 transition-colors text-center mt-2 disabled:opacity-50"
                >
                  {deleting ? 'Suppression…' : 'Supprimer mon compte'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
