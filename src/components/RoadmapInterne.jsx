import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './Sidebar'
import Footer from './Footer'

// Page interne, réservée aux admins — notes de travail sur les
// systèmes de rémunération en cours de réflexion (rétro-commission,
// parrainage, créateurs de contenu). Contenu volontairement brut/non
// poli, pas destiné aux users finaux.
export default function RoadmapInterne() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
  }, [])

  if (!user) return null

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Sidebar />

      <div className="flex-1 ml-0 sm:ml-16 px-4 sm:px-6 pt-20 sm:pt-10 pb-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-3xl text-navy mb-2">RetroCommission</h1>
          <p className="text-navy/60 mb-8">
            Notes de travail — visible uniquement par toi. Contenu brut, décisions non finalisées.
          </p>

          <div className="bg-white border border-navy/10 rounded-2xl p-6 sm:p-8">
            <p className="font-serif text-2xl text-navy mb-4">Systèmes de rémunération LVPT</p>
            <p className="text-sm text-navy/70 mb-8">
              Trois systèmes distincts, à ne pas confondre entre eux.
            </p>

            {/* -------------------- 1. Rétro-commission -------------------- */}
            <section className="mb-8">
              <p className="font-serif text-lg text-navy mb-3">
                1. Rétro-commission / affiliation <span className="text-xs font-sans text-navy/40">(des partenaires reversent à LVPT)</span>
              </p>
              <ul className="list-disc list-outside pl-5 flex flex-col gap-2 text-sm text-navy/75">
                <li>
                  <span className="font-medium text-navy">Principe</span> : liens de réservation trackés vers des partenaires (Booking.com, compagnies aériennes, GetYourGuide/Viator...) — si un user réserve via ce lien, le partenaire reverse une commission à LVPT, sans coût supplémentaire pour l'utilisateur.
                </li>
                <li>
                  <span className="font-medium text-navy">Approche recommandée</span> : passer par un agrégateur d'affiliation unique (ex: TravelPayouts) plutôt que négocier directement avec chaque partenaire.
                </li>
                <li>
                  <span className="font-medium text-navy">Impact technique envisagé</span> : <code className="bg-navy/5 px-1.5 py-0.5 rounded text-xs">lien_resa</code> pointerait vers un lien de tracking ; identifiant user possible dans le lien ; éventuelle table de log des clics.
                </li>
                <li className="text-navy/50">
                  <span className="font-medium">Non tranché</span> : quel(s) module(s) en premier, compte agrégateur déjà existant ou à créer, mention de divulgation à afficher ou non.
                </li>
              </ul>
            </section>

            {/* -------------------- 2. Parrainage -------------------- */}
            <section className="mb-8">
              <p className="font-serif text-lg text-navy mb-3">
                2. Programme de parrainage <span className="text-xs font-sans text-navy/40">(LVPT reverse à un user qui en a parrainé un autre)</span>
              </p>
              <ul className="list-disc list-outside pl-5 flex flex-col gap-2 text-sm text-navy/75">
                <li>
                  <span className="font-medium text-navy">Principe</span> : User A invite User B ; si B s'abonne à un plan payant, A est récompensé.
                </li>
                <li>
                  <span className="font-medium text-navy">Récompense</span> : crédit interne (ex: mois gratuit), pas d'argent réel — évite la lourdeur d'un système de paiement sortant et les implications fiscales/KYC.
                </li>
                <li>
                  <span className="font-medium text-navy">Déclenchement</span> : ponctuel (au premier paiement du filleul), pas récurrent.
                </li>
                <li className="text-navy/50">
                  <span className="font-medium">Non tranché</span> : montant exact de la récompense, plafond éventuel de mois cumulables.
                </li>
              </ul>
              <p className="text-xs text-navy/40 mt-2">Statut : idée conservée, à développer plus tard.</p>
            </section>

            {/* -------------------- 3. Créateurs de contenu -------------------- */}
            <section className="mb-8">
              <p className="font-serif text-lg text-navy mb-3">3. Rémunération des créateurs de contenu qui "fonctionne"</p>
              <p className="text-sm text-navy/70 mb-4">
                Le sujet le plus travaillé. Objectif : récompenser les users dont les itinéraires et posts Voyage Commun sont réellement utiles à la communauté (mesuré via le vote), sans que ce soit gamable facilement une fois de l'argent en jeu.
              </p>

              <p className="text-xs font-medium text-navy/50 uppercase tracking-wide mb-2">Décisions prises</p>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {[
                      ['Métrique principale', 'Le score de vote (seule métrique fiable disponible aujourd\'hui)'],
                      ['Éligibilité au vote', 'Ouvert à tout le monde (pas seulement plan max) — déjà le cas sur Voyage Commun ; sur Itinéraires, il faudra rendre le vote/favori visibles même sur les cartes verrouillées (seul le détail complet reste payant)'],
                      ['Éligibilité à la rémunération', 'Réservée aux abonnés au plan max uniquement'],
                      ['Variété exigée', 'Au moins 1 itinéraire ET au moins 1 post Voyage Commun'],
                      ['Volume minimum', 'Voyage Commun : 10 posts validés par le score. Itinéraires : "x" à fixer (proposition : 3, en attente de confirmation)'],
                      ['Qualité minimum', 'Score de vote au-dessus d\'un plancher (chiffre à définir)'],
                      ['Partage social', 'Écarté du calcul — invérifiable qu\'une publication ait vraiment eu lieu. Reste utile comme métrique interne d\'usage seulement.'],
                      ['Ancienneté', 'Mise de côté pour l\'instant (ni compte, ni contenu)'],
                      ['Périodicité de calcul', 'Mensuelle'],
                      ['Validation finale', 'Manuelle par l\'admin avant tout paiement, quel que soit le score calculé'],
                      ['Forme de récompense', 'Pas encore tranchée entre crédit interne (mois offerts) et reconnaissance pure (badge, mise en avant)'],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-navy/5 last:border-0">
                        <td className="py-2.5 pr-4 text-xs font-medium text-navy/60 whitespace-nowrap align-top w-48">{label}</td>
                        <td className="py-2.5 text-navy/80">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs font-medium text-navy/50 uppercase tracking-wide mb-2">Pistes complémentaires — pas encore actées</p>
              <ol className="list-decimal list-outside pl-5 flex flex-col gap-2 text-sm text-navy/75 mb-6">
                <li>Score net (votes positifs − négatifs), pas le volume brut d'interactions</li>
                <li>Empêcher l'auto-vote — actuellement <span className="font-medium text-navy">rien dans le code n'empêche</span> un user de voter sur son propre contenu, à corriger avant de mettre de l'argent en jeu</li>
                <li>Fenêtre de calcul du score — ne compter que les votes gagnés pendant le mois en cours, pour éviter qu'un même contenu rapporte indéfiniment</li>
                <li>Plafond mensuel — budget ou nombre max de créateurs récompensés par mois</li>
                <li>Vigilance sur les "clans de votes" — groupes qui se votent mutuellement de façon croisée</li>
              </ol>

              <div className="bg-navy/5 rounded-xl p-4">
                <p className="text-xs font-medium text-navy mb-1.5">Anti-triche déjà acquis "gratuitement"</p>
                <p className="text-xs text-navy/70 leading-relaxed">
                  Exiger l'abonnement max pour être <span className="font-medium">rémunéré</span> (pas pour voter) change déjà le calcul économique de la fraude : créer des faux comptes pour gonfler son propre score ne suffit plus, il faudrait aussi payer des abonnements au tarif le plus cher — mais ça ne concerne que qui reçoit la récompense, pas qui vote (le vote reste ouvert à tous).
                </p>
              </div>
            </section>

            {/* -------------------- Rappel légal -------------------- */}
            <div className="border-t border-navy/10 pt-6 mb-6">
              <p className="text-xs font-medium text-navy mb-1.5">📌 Rappel en attente (sujet non lié)</p>
              <p className="text-xs text-navy/70">
                Pages légales à créer dans le footer : CGU, CGV, politique de confidentialité, mentions légales. Toujours pas fait.
              </p>
            </div>

            {/* -------------------- Reste à trancher -------------------- */}
            <div className="border-t border-navy/10 pt-6">
              <p className="text-xs font-medium text-navy mb-2">Reste à trancher pour boucler le point 3</p>
              <ol className="list-decimal list-outside pl-5 flex flex-col gap-1.5 text-sm text-navy/75">
                <li>Le chiffre "x" pour le minimum d'itinéraires (proposition : 3)</li>
                <li>Lesquelles des 5 pistes complémentaires retenir</li>
                <li>Forme de la récompense (crédit interne vs reconnaissance)</li>
                <li>Montant/valeur exacte de la récompense, une fois la forme choisie</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-0 sm:ml-16">
        <Footer />
      </div>
    </div>
  )
}
