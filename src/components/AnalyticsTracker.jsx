import { useEffect } from 'react'
import { hasAnalyticsConsent } from './CookieConsent'

const GA_MEASUREMENT_ID = 'G-PHZ2FN6G1J'
const HOTJAR_ID = 3913405
const HOTJAR_VERSION = 6
const METRICOOL_HASH = '725faf11d24e3d37d4860700aec4c384'

function loadScript(src, onLoad) {
  const script = document.createElement('script')
  script.async = true
  script.src = src
  if (onLoad) script.onload = onLoad
  document.head.appendChild(script)
  return script
}

function loadGoogleAnalytics() {
  if (window.gtag) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }

  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID)
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`)
}

function loadHotjar() {
  if (window.hj) return

  window.hj = window.hj || function hj() {
    ;(window.hj.q = window.hj.q || []).push(arguments)
  }
  window._hjSettings = { hjid: HOTJAR_ID, hjsv: HOTJAR_VERSION }

  loadScript(`https://static.hotjar.com/c/hotjar-${HOTJAR_ID}.js?sv=${HOTJAR_VERSION}`)
}

function loadMetricool() {
  if (window.beTracker) return

  loadScript('https://tracker.metricool.com/resources/be.js', () => {
    if (window.beTracker?.t) {
      window.beTracker.t({ hash: METRICOOL_HASH })
    }
  })
}

function loadAnalyticsTrackers() {
  if (!hasAnalyticsConsent()) return

  loadGoogleAnalytics()
  loadHotjar()
  loadMetricool()
}

export default function AnalyticsTracker() {
  useEffect(() => {
    loadAnalyticsTrackers()

    const handleConsent = () => loadAnalyticsTrackers()
    window.addEventListener('lvpt:analytics-consent', handleConsent)

    return () => {
      window.removeEventListener('lvpt:analytics-consent', handleConsent)
    }
  }, [])

  return null
}
