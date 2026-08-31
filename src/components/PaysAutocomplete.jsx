import React, { useState, useRef, useEffect, useMemo } from 'react'
import airports from '../data/airports.json'

// Liste unique des pays, extraite du même fichier de données que
// AirportAutocomplete.jsx (airports.json contient déjà un champ
// "country") — pas besoin d'un second fichier à maintenir, et ça garde
// les deux composants cohérents sur les mêmes noms de pays.
const ALL_COUNTRIES = [...new Set(airports.map((a) => a.country))].sort((a, b) =>
  a.localeCompare(b, 'fr')
)

// Recherche simple : correspond au début ou n'importe où dans le nom du
// pays. Priorité aux correspondances qui commencent par la requête (ex:
// "fra" -> France avant "Afrique du Sud"). Limité à 8 résultats pour
// rester lisible dans la liste déroulante, même logique qu'AirportAutocomplete.
function searchCountries(query) {
  const q = query.trim().toLowerCase()
  if (q.length < 1) return []

  return ALL_COUNTRIES
    .filter((country) => country.toLowerCase().includes(q))
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(q) ? 0 : 1
      const bStarts = b.toLowerCase().startsWith(q) ? 0 : 1
      return aStarts - bStarts
    })
    .slice(0, 8)
}

/**
 * Champ avec autocomplétion de pays — même comportement et même style
 * qu'AirportAutocomplete.jsx (navigation clavier, fermeture au clic
 * extérieur), mais pour choisir un pays plutôt qu'un aéroport.
 *
 * Props :
 * - label       : texte au-dessus du champ (ex: "Pays")
 * - placeholder : texte indicatif (ex: "France")
 * - value       : valeur actuelle (string, ex: "France")
 * - onChange    : appelé avec le nom du pays choisi
 * - required    : affiche l'astérisque rouge si vrai
 */
export default function PaysAutocomplete({ label, placeholder, value, onChange, required }) {
  const [inputValue, setInputValue] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const wrapperRef = useRef(null)

  // Garde le champ synchronisé si la valeur est mise à jour depuis
  // l'extérieur (ex: reset du formulaire).
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  // Ferme la liste si on clique en dehors du champ.
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
    const results = searchCountries(next)
    setSuggestions(results)
    setIsOpen(results.length > 0)
    // Contrairement à AirportAutocomplete, on pousse quand même la valeur
    // tapée au parent à chaque frappe (pas seulement à la sélection) :
    // un pays tapé en texte libre reste une info valable pour un
    // formulaire de plat/lieu, même s'il ne correspond à aucune
    // suggestion connue (petit pays absent d'airports.json, faute de
    // frappe volontairement laissée telle quelle par l'utilisateur...).
    onChange(next)
  }

  function selectCountry(country) {
    setInputValue(country)
    onChange(country)
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
        selectCountry(suggestions[highlightedIndex])
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
          {suggestions.map((country, index) => (
            <li
              key={country}
              onMouseDown={() => selectCountry(country)}
              className={`px-4 py-2.5 cursor-pointer text-sm text-navy ${
                index === highlightedIndex ? 'bg-coral/10' : 'hover:bg-cream'
              }`}
            >
              {country}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
