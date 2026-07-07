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
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
