import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import CookieConsent from './components/CookieConsent'
import AnalyticsTracker from './components/AnalyticsTracker'
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
import AdminRoute from './components/AdminRoute'
import ItineraireEditEnhancer from './components/ItineraireEditEnhancer'
import ContentEditEnhancer from './components/ContentEditEnhancer'

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
const ContentManager = lazy(() => import('./components/ContentManager'))

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
      <AnalyticsTracker />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/vols-hebergements" element={<ProtectedRoute><VolsHebergements /></ProtectedRoute>} />
          <Route path="/itineraires" element={<ProtectedRoute><Itineraires /></ProtectedRoute>} />
          <Route path="/itineraires/:id" element={<ProtectedRoute><ItineraireEditEnhancer><ItineraireDetail /></ItineraireEditEnhancer></ProtectedRoute>} />
          <Route path="/spa-bien-etre" element={<ProtectedRoute><SpaBienEtre /></ProtectedRoute>} />
          <Route path="/voyage-commun" element={<ProtectedRoute><ContentEditEnhancer><VoyageCommun /></ContentEditEnhancer></ProtectedRoute>} />
          <Route path="/voyage-commun/:id" element={<ProtectedRoute><VoyageCommunDetail /></ProtectedRoute>} />
          <Route path="/mes-contenus" element={<ProtectedRoute><ContentManager /></ProtectedRoute>} />
          <Route path="/feuille-de-route" element={<AdminRoute><RoadmapInterne /></AdminRoute>} />
          <Route path="/defis-communaute" element={<AdminRoute><DefisCommunaute /></AdminRoute>} />
          <Route path="/admin-offres" element={<AdminRoute><AdminOffres /></AdminRoute>} />
          <Route path="/espace-pro" element={<AdminRoute><EspacePro /></AdminRoute>} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/cgu" element={<CGU />} />
          <Route path="/cgv" element={<CGV />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="/sejours" element={<ProtectedRoute><Sejours /></ProtectedRoute>} />
          <Route path="/depenses" element={<ProtectedRoute><ContentEditEnhancer><Depenses /></ContentEditEnhancer></ProtectedRoute>} />
          <Route path="/playlist" element={<ProtectedRoute><ContentEditEnhancer><Playlist /></ContentEditEnhancer></ProtectedRoute>} />
          <Route path="/activites" element={<ProtectedRoute><ContentEditEnhancer><Activites /></ContentEditEnhancer></ProtectedRoute>} />
          <Route path="/carnet-gastronomique" element={<ProtectedRoute><ContentEditEnhancer><Gastronomie /></ContentEditEnhancer></ProtectedRoute>} />
          <Route path="/carnet-gastronomique/:id" element={<ProtectedRoute><PlatDetail /></ProtectedRoute>} />
          <Route path="/ateliers" element={<ProtectedRoute><Ateliers /></ProtectedRoute>} />
          <Route path="/ateliers/confirmation" element={<ProtectedRoute><AtelierConfirmation /></ProtectedRoute>} />
          <Route path="/ateliers/:id" element={<ProtectedRoute><AtelierDetail /></ProtectedRoute>} />
          <Route path="/miles-vs-euros" element={<ProtectedRoute><MilesVsEuros /></ProtectedRoute>} />
        </Routes>
      </Suspense>
      <CookieConsent />
    </BrowserRouter>
  )
}
