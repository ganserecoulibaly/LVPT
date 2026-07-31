import React, { useState, useRef, useEffect } from 'react'
import airports from '../data/airports.json'

// Recherche simple : correspond sur la ville, le nom de l'aéroport, le pays ou le code IATA.
// Limité à 8 résultats pour rester lisible dans la liste déroulante.
function searchAirports(query) {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  return airports
    .filter((a) =>
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q) ||
      a.iata.toLowerCase() === q
    )
    // priorité aux correspondances qui commencent par la requête (ex: "par" -> Paris avant Parana)
    .sort((a, b) => {
      const aStarts = a.city.toLowerCase().startsWith(q) ? 0 : 1
      const bStarts = b.city.toLowerCase().startsWith(q) ? 0 : 1
      return aStarts - bStarts
    })
    .slice(0, 8)
}

/**
 * Champ avec autocomplétion d'aéroports.
 *
 * Props :
 * - label       : texte au-dessus du champ (ex: "Je pars de")
 * - placeholder : texte indicatif (ex: "Paris (CDG)")
 * - value       : valeur actuelle (string, ex: "Paris (CDG)")
 * - onChange    : appelé avec la nouvelle valeur formatée quand l'utilisateur choisit un aéroport
 * - required    : affiche l'astérisque rouge si vrai
 */
export default function AirportAutocomplete({ label, placeholder, value, onChange, required }) {
  const [inputValue, setInputValue] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const wrapperRef = useRef(null)

  // Garde le champ synchronisé si la valeur est mise à jour depuis l'extérieur (ex: reset du formulaire)
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  // Ferme la liste si on clique en dehors du champ
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(e) {
    const next = e.target.value
    setInputValue(next)
    setHighlightedIndex(-1)
    const results = searchAirports(next)
    setSuggestions(results)
    setIsOpen(results.length > 0)
    // tant que rien n'est sélectionné dans la liste, on ne pousse pas encore la valeur
    // au parent — ça évite d'enregistrer du texte libre non reconnu comme un aéroport
  }

  function selectAirport(airport) {
    const formatted = `${airport.city} (${airport.iata})`
    setInputValue(formatted)
    onChange(formatted)
    setIsOpen(false)
    setSuggestions([])
  }

  function handleKeyDown(e) {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0) {
        selectAirport(suggestions[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5 relative" ref={wrapperRef}>
      <label className="font-sans text-navy/50 text-xs uppercase tracking-wide font-medium">
        {label}
        {required && <span className="text-coral"> *</span>}
      </label>

      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
      />

      {isOpen && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-navy/10 rounded-xl shadow-lg max-h-64 overflow-y-auto z-20">
          {suggestions.map((airport, index) => (
            <li
              key={airport.iata}
              onMouseDown={() => selectAirport(airport)}
              className={`px-4 py-2.5 cursor-pointer flex items-center justify-between gap-3 text-sm ${
                index === highlightedIndex ? 'bg-coral/10' : 'hover:bg-cream'
              }`}
            >
              <span className="text-navy">
                {airport.city}
                <span className="text-navy/50 ml-1">— {airport.name}</span>
              </span>
              <span className="text-navy/40 font-mono text-xs shrink-0">{airport.iata}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
