import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Sidebar from './Sidebar'
import Footer from './Footer'

// Page interne, réservée aux admins — notes de travail sur les
// systèmes de rémunération en cours de réflexion (rétro-commission,
// parrainage, créateurs de contenu, composante Miles). Contenu
// volontairement brut/non poli, pas destiné aux users finaux.
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
              Quatre sujets distincts, à ne pas confondre entre eux.
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
                  <span className="font-medium text-navy">Récompense envisagée</span> : très probablement le même mécanisme que le point 3 ci-dessous (code promo Stripe), plutôt que de construire un système de crédit séparé — à confirmer une fois le point 3 finalisé.
                </li>
                <li>
                  <span className="font-medium text-navy">Déclenchement</span> : ponctuel (au premier paiement du filleul), pas récurrent.
                </li>
                <li className="text-navy/50">
                  <span className="font-medium">Non tranché</span> : montant exact de la récompense, plafond éventuel de mois/années cumulables.
                </li>
              </ul>
              <p className="text-xs text-navy/40 mt-2">Statut : idée conservée, à développer plus tard.</p>
            </section>

            {/* -------------------- 3. Créateurs de contenu -------------------- */}
            <section className="mb-8">
              <p className="font-serif text-lg text-navy mb-3">3. Rémunération des créateurs de contenu qui "fonctionne"</p>
              <p className="text-sm text-navy/70 mb-4">
                Le sujet le plus travaillé, et le plus avancé ce soir. Objectif : récompenser les users dont les itinéraires et posts Voyage Commun sont réellement utiles à la communauté (mesuré via le vote), sans que ce soit gamable facilement une fois de l'argent en jeu. Ouvert à tous (free et payants), pas réservé aux abonnés max.
              </p>

              <p className="text-xs font-medium text-navy/50 uppercase tracking-wide mb-2">Décisions prises</p>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {[
                      ['Métrique principale', 'Le score de vote (seule métrique fiable disponible aujourd\'hui)'],
                      ['Éligibilité au vote', 'Uniquement sur le contenu visible par un compte free (les 3 derniers itinéraires publiés, tout Voyage Commun) — une carte verrouillée ne peut pas être votée. Bonus indirect : ça favorise les contenus qui percent vite pendant leur fenêtre de visibilité, un vrai signal de qualité ("item chaud").'],
                      ['Éligibilité à la rémunération', 'Ouverte à TOUS — free et payants, pas de restriction de plan (changement par rapport à la version précédente de cette page)'],
                      ['Variété exigée', 'Au moins 1 itinéraire ET au moins 1 post Voyage Commun'],
                      ['Volume minimum', '10 itinéraires ET 10 posts Voyage Commun — chiffre "x" enfin tranché (aligné sur Voyage Commun, plus de "3")'],
                      ['Condition de qualité par item', 'Chaque item comptabilisé dans le quota de 10 doit avoir reçu au moins 10 votes — pas juste "publié", vraiment "validé par la communauté"'],
                      ['Partage social', 'Écarté du calcul — invérifiable qu\'une publication ait vraiment eu lieu. Reste utile comme métrique interne d\'usage seulement.'],
                      ['Ancienneté', 'Mise de côté pour l\'instant (ni compte, ni contenu)'],
                      ['Périodicité de calcul', 'Mensuelle'],
                      ['Validation finale', 'Manuelle par l\'admin avant toute récompense, quel que soit le score calculé'],
                      ['Forme de récompense', 'TRANCHÉ : un code promo Stripe (coupon), jamais un vrai virement/PayPal — voir "Mécanisme retenu" plus bas'],
                      ['Cible de la récompense', "L'abonnement ANNUEL, jamais mensuel. Progression stricte d'un palier vers le suivant : free → code pour Voyageur occasionnel (milieu) en annuel ; Voyageur occasionnel → code pour Grand Voyageur (max) en annuel ; Grand Voyageur déjà annuel → code sur son renouvellement. Jamais de saut direct free → max. Bonus business : pousse à la fois vers l'annuel ET vers le plan supérieur, palier par palier."],
                      ['Animateurs Ateliers', 'Rejeté — ce sera toujours et uniquement toi qui animes les ateliers, pas les créateurs récompensés'],
                      ['Badge / reconnaissance sociale', 'Rejeté — jugé sans valeur ajoutée réelle, on ne construit que la récompense concrète (code promo)'],
                      ['Suivi utilisateur', 'À construire : chaque user doit voir sa propre progression sur cette page (ex: "Itinéraires qualifiants : 6/10", "Voyage Commun qualifiants : 8/10") — pas juste toi en admin'],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-navy/5 last:border-0">
                        <td className="py-2.5 pr-4 text-xs font-medium text-navy/60 whitespace-nowrap align-top w-48">{label}</td>
                        <td className="py-2.5 text-navy/80">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs font-medium text-navy/50 uppercase tracking-wide mb-2">Mécanisme technique retenu pour la récompense</p>
              <ul className="list-disc list-outside pl-5 flex flex-col gap-2 text-sm text-navy/75 mb-6">
                <li>
                  <span className="font-medium text-navy">Pourquoi un code promo plutôt qu'un virement/PayPal</span> : côté fiscal/comptable, un virement à un particulier peut déclencher des obligations déclaratives (à vérifier avec un comptable selon montants/fréquence). Un code promo, c'est juste une remise commerciale de ton côté — rien à déclarer en plus, aucune donnée bancaire à collecter.
                </li>
                <li>
                  <span className="font-medium text-navy">Comment</span> : coupons créés côté Stripe (ex: 3 coupons à pourcentages fixes), appliqués manuellement par toi une fois la validation faite — cohérent avec la validation manuelle déjà actée.
                </li>
                <li>
                  <span className="font-medium text-navy">Décalage rythme mensuel / cycle annuel</span> : le calcul reste mensuel, mais l'abonnement annuel ne se renouvelle qu'une fois par an. Piste proposée (⚠️ pas encore confirmée explicitement) : le code du dernier mois valide remplace le précédent, plutôt qu'un cumul sur 12 mois — à trancher.
                </li>
              </ul>

              <p className="text-xs font-medium text-navy/50 uppercase tracking-wide mb-2">Pistes complémentaires — pas encore actées</p>
              <ol className="list-decimal list-outside pl-5 flex flex-col gap-2 text-sm text-navy/75 mb-6">
                <li>Score net (votes positifs − négatifs), pas le volume brut d'interactions</li>
                <li>Empêcher l'auto-vote — actuellement <span className="font-medium text-navy">rien dans le code n'empêche</span> un user de voter sur son propre contenu, à corriger avant de mettre de la vraie valeur en jeu</li>
                <li>Plafond mensuel — budget ou nombre max de créateurs récompensés par mois</li>
                <li>Vigilance sur les "clans de votes" — groupes qui se votent mutuellement de façon croisée</li>
              </ol>

              <div className="bg-navy/5 rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-navy mb-1.5">Anti-triche — suppression puis recréation du même item</p>
                <p className="text-xs text-navy/70 leading-relaxed">
                  Comme chaque item doit atteindre 10 votes <span className="font-medium">à lui seul</span> pour compter dans le quota, un item recréé repart à 0 vote — très difficile d'accumuler 10 votes organiques sur un contenu tout juste recréé avant l'échéance mensuelle. Frein naturel déjà solide. Complément prévu : un compteur "nombre total d'items créés à vie" par user (ne redescend jamais, même après suppression), visible dans le futur suivi admin pour repérer un pattern de suppression/recréation répétée.
                </p>
              </div>

              <div className="bg-navy/5 rounded-xl p-4">
                <p className="text-xs font-medium text-navy mb-1.5">Anti-triche déjà acquis "gratuitement" (obsolète en partie)</p>
                <p className="text-xs text-navy/70 leading-relaxed">
                  ⚠️ Cette note datait de quand la récompense était réservée aux abonnés max — devenu partiellement caduc puisque la rémunération est maintenant ouverte à tous. Le vrai garde-fou aujourd'hui repose sur les seuils eux-mêmes (10 items, chacun avec 10 votes organiques réels) plutôt que sur le coût d'un abonnement payant.
                </p>
              </div>
            </section>

            {/* -------------------- 4. Composante Miles -------------------- */}
            <section className="mb-8">
              <p className="font-serif text-lg text-navy mb-3">
                4. Composante Miles <span className="text-xs font-sans text-navy/40">(nouveau sujet, tout début de réflexion)</span>
              </p>
              <ul className="list-disc list-outside pl-5 flex flex-col gap-2 text-sm text-navy/75">
                <li>
                  <span className="font-medium text-navy">Contexte</span> : les champs miles Star Alliance/SkyTeam/Oneworld viennent d'être ajoutés au profil utilisateur (saisie manuelle, affichage sur le Dashboard). Cette section explore comment aller plus loin.
                </li>
                <li>
                  <span className="font-medium text-navy">Idée n°1 — outil d'appel</span> : un petit widget public (landing page probable, à confirmer) qui calcule "combien tu aurais pu économiser sur ton dernier voyage" — 2-3 questions max (prix payé, classe, direct/escale), résultat sous forme d'estimation indicative (pas un vrai comparateur de prix en temps réel pour commencer), qui pousse vers l'atelier "Voyager en business sans payer le plein tarif" ou vers l'inscription.
                </li>
                <li className="text-navy/50">
                  <span className="font-medium">Non tranché</span> : public ou privé, quelles questions exactement poser, vers quoi rediriger le résultat, lien ou non avec les miles déjà saisis au profil. Sujet mis en pause ce soir au profit du point 3, à reprendre.
                </li>
              </ul>
            </section>

            {/* -------------------- Reste à trancher -------------------- */}
            <div className="border-t border-navy/10 pt-6">
              <p className="text-xs font-medium text-navy mb-2">Reste à trancher pour boucler le point 3</p>
              <ol className="list-decimal list-outside pl-5 flex flex-col gap-1.5 text-sm text-navy/75">
                <li>Décalage mensuel/annuel : confirmer "dernier mois valide remplace le précédent" (option proposée, pas encore validée explicitement) vs un cumul sur 12 mois</li>
                <li>Pourcentages exacts des paliers de réduction (mis de côté jusqu'à ce que les conditions soient ficelées)</li>
                <li>Lesquelles des pistes anti-triche complémentaires retenir (score net, anti-auto-vote, plafond mensuel, clans de votes)</li>
                <li>Construction technique du suivi utilisateur en temps réel sur cette page</li>
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
