import React, { useEffect } from 'react'

const REPLACEMENTS = {
  'Voyage Commun': 'Le Comptoir Voyage',
  'voyage commun': 'Le Comptoir Voyage',
  'Voyage commun': 'Le Comptoir Voyage',
}

function replaceText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  let node
  while ((node = walker.nextNode())) nodes.push(node)
  nodes.forEach((textNode) => {
    let value = textNode.nodeValue
    Object.entries(REPLACEMENTS).forEach(([from, to]) => { value = value.split(from).join(to) })
    if (value !== textNode.nodeValue) textNode.nodeValue = value
  })

  root.querySelectorAll('[aria-label],[title],[alt],[placeholder]').forEach((el) => {
    ;['aria-label', 'title', 'alt', 'placeholder'].forEach((attr) => {
      const value = el.getAttribute(attr)
      if (!value) return
      let next = value
      Object.entries(REPLACEMENTS).forEach(([from, to]) => { next = next.split(from).join(to) })
      if (next !== value) el.setAttribute(attr, next)
    })
  })
}

export default function DisplayLabelEnhancer({ children }) {
  useEffect(() => {
    replaceText(document.body)
    const observer = new MutationObserver(() => replaceText(document.body))
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  return children
}
