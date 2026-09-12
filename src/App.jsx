import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import CookieConsent from './components/CookieConsent'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import FlightHotelSearch from './components/FlightHotelSearch'
import Services from './components/Services'
import HowItWorks from './components/HowItWorks'
import ComingSoon from './components/ComingSoon'
import Testimonials from './components/Testimonials'
import WaitlistForm from './components/WaitlistForm'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

// Pages privées et secondaires chargées à la demande (lazy) — réduit le
// bundle JS initial téléchargé sur la landing page publique. Chaque page
// devient un chunk séparé, chargé seulement quand l'utilisateur y navigue.
const Dashboard = lazy(() => import('./components/Dashboard'))
const VolsHebergements = lazy(() => import('./components/VolsHebergements'))
const Itineraires = lazy(() => import('./components/Itineraires'))
const ItineraireDetail = lazy(() => import('./components/ItineraireDetail'))
const VoyageCommun = lazy(() => import('./components/VoyageCommun'))
const VoyageCommunDetail = lazy(() => import('./components/VoyageCommunDetail'))
const RoadmapInterne = lazy(() => import('./components/RoadmapInterne'))
const MentionsLegales = lazy(() => import('./components/legal/MentionsLegales'))
const CGU = lazy(() => import('./components/legal/CGU'))
const CGV = lazy(() => import('./components/legal/CGV'))
const Confidentialite = lazy(() => import('./components/legal/Confidentialite'))
const Ateliers = lazy(() => import('./components/atelier/Ateliers'))
const Sejours = lazy(() => import('./components/Sejours'))
const Depenses = lazy(() => import('./components/Depenses'))
const Playlist = lazy(() => import('./components/Playlist'))
const Activites = lazy(() => import('./components/Activites'))
const Gastronomie = lazy(() => import('./components/Gastronomie'))
const PlatDetail = lazy(() => import('./components/PlatDetail'))
const AtelierDetail = lazy(() => import('./components/atelier/AtelierDetail'))
const AtelierConfirmation = lazy(() => import('./components/atelier/AtelierConfirmation'))
const MilesVsEuros = lazy(() => import('./components/MilesVsEuros'))
const DefisCommunaute = lazy(() => import('./components/DefisCommunaute'))
const AdminOffres = lazy(() => import('./components/AdminOffres'))
const EspacePro = lazy(() => import('./components/EspacePro'))
const SpaBienEtre = lazy(() => import('./components/SpaBienEtre'))

// Au fur et à mesure, importe ici les futures pages privées (en lazy) :
// const Carnet = lazy(() => import('./components/Carnet'))
// const Profil = lazy(() => import('./components/Profil'))

function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <FlightHotelSearch />
      <Services />
      <HowItWorks />
      <ComingSoon />
      <Testimonials />
      <WaitlistForm />
      <Footer />
    </div>
  )
}

// Affiché brièvement pendant le chargement d'un chunk lazy (navigation vers
// une page privée). Simple et neutre, cohérent avec le fond crème du site.
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-2 border-coral border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Page publique */}
          <Route path="/" element={<HomePage />} />

          {/* Pages privées : chacune enveloppée dans ProtectedRoute */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vols-hebergements"
            element={
              <ProtectedRoute>
                <VolsHebergements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itineraires"
            element={
              <ProtectedRoute>
                <Itineraires />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itineraires/:id"
            element={
              <ProtectedRoute>
                <ItineraireDetail />
              </ProtectedRoute>
            }
          />

          {/* Ajoutée juste après Itinéraires — plan Gratuit, aucun verrou de
              plan côté route (la Sidebar l'affiche déjà sans cadenas). */}
          <Route
            path="/spa-bien-etre"
            element={
              <ProtectedRoute>
                <SpaBienEtre />
              </ProtectedRoute>
            }
          />

          <Route
            path="/voyage-commun"
            element={
              <ProtectedRoute>
                <VoyageCommun />
              </ProtectedRoute>
            }
          />
          <Route
            path="/voyage-commun/:id"
            element={
              <ProtectedRoute>
                <VoyageCommunDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feuille-de-route"
            element={
              <ProtectedRoute>
                <RoadmapInterne />
              </ProtectedRoute>
            }
          />

          {/* Pages légales — publiques, consultables sans compte */}
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/cgu" element={<CGU />} />
          <Route path="/cgv" element={<CGV />} />
          <Route path="/confidentialite" element={<Confidentialite />} />

          <Route
            path="/sejours"
            element={
              <ProtectedRoute>
                <Sejours />
              </ProtectedRoute>
            }
          />

          <Route
            path="/depenses"
            element={
              <ProtectedRoute>
                <Depenses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/playlist"
            element={
              <ProtectedRoute>
                <Playlist />
              </ProtectedRoute>
            }
          />

          <Route
            path="/activites"
            element={
              <ProtectedRoute>
                <Activites />
              </ProtectedRoute>
            }
          />

          <Route
            path="/carnet-gastronomique"
            element={
              <ProtectedRoute>
                <Gastronomie />
              </ProtectedRoute>
            }
          />
          <Route
            path="/carnet-gastronomique/:id"
            element={
              <ProtectedRoute>
                <PlatDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ateliers"
            element={
              <ProtectedRoute>
                <Ateliers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ateliers/confirmation"
            element={
              <ProtectedRoute>
                <AtelierConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ateliers/:id"
            element={
              <ProtectedRoute>
                <AtelierDetail />
              </ProtectedRoute>
            }
          />

          {/* Encart "Miles" de la sidebar — accessible dès le plan Gratuit,
              donc juste ProtectedRoute (connexion requise) sans verrou de plan. */}
          <Route
            path="/miles-vs-euros"
            element={
              <ProtectedRoute>
                <MilesVsEuros />
              </ProtectedRoute>
            }
          />

          <Route
            path="/defis-communaute"
            element={
              <ProtectedRoute>
                <DefisCommunaute />
              </ProtectedRoute>
            }
          />

          {/* Page admin-only : le lien n'apparaît que pour is_admin dans la
              Sidebar (AdminOnlyNavItem, même logique que /defis-communaute et
              /feuille-de-route) — connexion requise, pas de vérification
              is_admin supplémentaire au niveau de la route pour l'instant. */}
          <Route
            path="/admin-offres"
            element={
              <ProtectedRoute>
                <AdminOffres />
              </ProtectedRoute>
            }
          />

          <Route
            path="/espace-pro"
            element={
              <ProtectedRoute>
                <EspacePro />
              </ProtectedRoute>
            }
          />

          {/*
            Pour chaque nouvelle page privée, même schéma :
            <Route
              path="/carnet"
              element={
                <ProtectedRoute>
                  <Carnet />
                </ProtectedRoute>
              }
            />
          */}
        </Routes>
      </Suspense>
      <CookieConsent />
    </BrowserRouter>
  )
}