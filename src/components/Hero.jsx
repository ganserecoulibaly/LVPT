import React from 'react'
import { BookOpen, Gift } from "lucide-react";

export default function Hero() {
  return (
    <section className="min-h-screen bg-cream flex items-center pt-20">
      <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">

        {/* Left content */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8735a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.7.6-.4 1L6 12l-2 3.5c-.3.5 0 1.1.5 1.3l4 1.5 1.5 4c.2.5.8.8 1.3.5L14 20l4.6 4.6c.4.4 1 .1 1-.4"/>
            </svg>
            <span className="font-sans text-navy/60 text-xs uppercase tracking-widest font-medium">Le compagnon des voyageurs curieux</span>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl text-navy font-medium leading-tight mb-6">
            Chaque <em className="text-coral not-italic">détour</em><br />
            mérite d'être<br />
            raconté.
          </h1>


{/* Bloc 1 — carnet communautaire */}
<div className="flex items-start gap-3 max-w-md mb-3">
  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-coral/20 flex items-center justify-center mt-px">
    <BookOpen className="w-3.5 h-3.5" stroke="#e8735a" strokeWidth={2} />
  </div>
  <p className="font-sans text-navy text-base font-normal leading-relaxed m-0">
    <span className="bg-[#D85A30] text-[#FAECE7] px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
      Un carnet de voyage moderne
    </span>{' '}
    pour garder une trace de tes plats préférés, dépenses, musées & visites, hébergements, playlists et documents — et accéder à ce que d'autres voyageurs ont déjà{' '}
    <span className="bg-[#D85A30] text-[#FAECE7] px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
      noté, conseillé ou partagé
    </span>.
  </p>
</div>

{/* Bloc 2 — recherche gratuite vols/hébergements */}
<div className="flex items-start gap-3 max-w-md mb-10">
  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-coral/20 flex items-center justify-center mt-px">
    <Gift className="w-3.5 h-3.5" stroke="#e8735a" strokeWidth={2} />
  </div>
  <p className="section-subtitle">
    Et pour commencer l'aventure :{' '}
    <span className="bg-[#D85A30] text-[#FAECE7] px-2 py-0.5 rounded-md font-medium whitespace-nowrap">
      deux modules gratuits
    </span>, dont la recherche de vols/hébergements et Voyage Commun.
  </p>
</div>


 <div className="flex flex-col sm:flex-row items-center gap-6">
            <a href="#recherche" className="btn-primary justify-center whitespace-nowrap">
              Commencer mon voyage
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </a>
            <a href="#services" className="btn-ghost">Découvrir les modules</a>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 mt-10">
            <div className="flex -space-x-2">
              {['#e8c4b8','#c4d4e8','#c8e0d0'].map((color, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-cream" style={{ backgroundColor: color }} />
              ))}
            </div>
            <span className="font-sans text-navy/60 text-sm">+200 voyageurs déjà inscrits sur la liste d'attente</span>
          </div>
        </div>

        {/*
          Right — polaroid stack.
          overflow-hidden en dessous de md : les polaroïds sont en position
          absolute avec des largeurs fixes (w-52 = 208px). Sur un écran étroit
          (~360px, moins le padding), deux polaroïds de 208px positionnés
          gauche/droite se chevauchent ou débordent du conteneur et
          provoquaient un scroll horizontal de toute la page. La largeur est
          réduite sur mobile (w-40) et resserrée (left-2/right-2 au lieu de
          left-4/right-4), avec overflow-hidden en filet de sécurité en
          dessous de md — désactivé à partir de md où il y a assez de place.
        */}
        <div className="relative flex justify-center items-center h-80 sm:h-96 md:h-auto overflow-hidden md:overflow-visible">
          {/* Annotation — décorative, masquée sous sm pour éviter la surcharge visuelle */}
          <span className="hidden sm:block absolute top-0 right-8 font-handwriting text-coral text-lg rotate-3 z-10">
            ✦ ton carnet, partout
          </span>

          {/* Polaroid 1 — map/planning */}
          <div className="absolute top-8 left-2 sm:left-4 md:left-8 bg-white p-3 shadow-lg rotate-[-4deg] z-20 w-40 sm:w-52">
            <div className="w-full h-28 sm:h-36 bg-gradient-to-br from-amber-100 to-amber-200 rounded flex items-center justify-center overflow-hidden">
              <div className="text-center">
                <div className="grid grid-cols-4 gap-0.5 p-2">
                  {Array.from({length:16}).map((_,i) => (
                    <div key={i} className="w-5 h-4 rounded-sm" style={{backgroundColor: `hsl(${30+i*8},${40+i*3}%,${65+i}%)`}} />
                  ))}
                </div>
              </div>
            </div>
            <p className="font-handwriting text-navy text-sm mt-2 text-center">Planning ✏️</p>
          </div>

          {/* Polaroid 2 — food */}
          <div className="absolute bottom-4 right-2 sm:right-0 md:right-4 bg-white p-3 shadow-lg rotate-[3deg] z-20 w-40 sm:w-52">
            <div className="w-full h-28 sm:h-36 bg-gradient-to-br from-orange-900 via-orange-700 to-amber-800 rounded overflow-hidden flex items-center justify-center">
              {/* Abstract restaurant scene */}
              <div className="relative w-full h-full">
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-black/30" />
                <div className="absolute top-2 left-2 right-2 flex justify-around">
                  {['🏮','🏮','🏮'].map((e,i) => <span key={i} className="text-xl">{e}</span>)}
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex gap-1">
                  {Array.from({length:6}).map((_,i) => (
                    <div key={i} className="h-8 w-6 rounded-t-sm bg-amber-900/80" />
                  ))}
                </div>
              </div>
            </div>
            <p className="font-handwriting text-navy text-sm mt-2 text-center">Hanoi — bún chả ★★★★★</p>
          </div>

          {/* Badge */}
          <div className="absolute bottom-16 left-2 sm:left-0 md:left-4 bg-white rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-md z-30 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-coral/20 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8735a" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
              </svg>
            </div>
            <div>
              <p className="font-serif text-navy text-sm font-medium leading-none">42 pays</p>
              <p className="font-sans text-navy/50 text-xs mt-0.5">tracés sur la carte</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
