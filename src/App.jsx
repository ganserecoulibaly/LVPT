import React from 'react'
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
import Dashboard from './components/Dashboard'
import VolsHebergements from './components/VolsHebergements'
import Itineraires from './components/Itineraires'
import ItineraireDetail from './components/ItineraireDetail'
import VoyageCommun from './components/VoyageCommun'
import VoyageCommunDetail from './components/VoyageCommunDetail'
import RoadmapInterne from './components/RoadmapInterne'
import MentionsLegales from './components/legal/MentionsLegales'
import CGU from './components/legal/CGU'
import CGV from './components/legal/CGV'
import Confidentialite from './components/legal/Confidentialite'
import Ateliers from './components/atelier/Ateliers'
import Sejours from './components/Sejours'
import Depenses from './components/Depenses'
import Playlist from './components/Playlist'
import Activites from './components/Activites'
import Gastronomie from './components/Gastronomie'
import PlatDetail from './components/PlatDetail'
import AtelierDetail from './components/atelier/AtelierDetail'
import AtelierConfirmation from './components/atelier/AtelierConfirmation'
import ProtectedRoute from './components/ProtectedRoute'
// Au fur et à mesure, importe ici les futures pages privées :
// import Carnet from './components/Carnet'
// import Profil from './components/Profil'

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

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
      <CookieConsent />
    </BrowserRouter>
  )
}
