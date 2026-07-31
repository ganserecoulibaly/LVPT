import React from 'react'
import Navbar from '../Navbar'
import Footer from '../Footer'

// Mise en page partagée par les 4 pages légales (Mentions légales, CGU,
// CGV, Confidentialité). Volontairement publique — pas de Sidebar ni de
// ProtectedRoute : ces pages doivent être consultables sans compte,
// avant même de s'inscrire.
export default function LegalPageLayout({ title, updatedAt, children }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto px-6 pt-28 pb-16 w-full">
        <h1 className="font-serif text-3xl text-navy mb-2">{title}</h1>
        <p className="text-xs text-navy/40 mb-10">Dernière mise à jour : {updatedAt}</p>

        <div className="flex flex-col gap-6 text-sm text-navy/80 leading-relaxed [&_h2]:font-serif [&_h2]:text-xl [&_h2]:text-navy [&_h2]:mt-4 [&_h2]:mb-1 [&_strong]:text-navy [&_strong]:font-medium [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </div>
      </div>

      <Footer />
    </div>
  )
}
