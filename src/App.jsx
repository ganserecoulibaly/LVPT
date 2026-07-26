import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
    </BrowserRouter>
  )
}
