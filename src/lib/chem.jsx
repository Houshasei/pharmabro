// Render chemistry formulas with proper subscripts/superscripts.
// Heuristic: digits immediately following uppercase-letter[+lowercase]* (an element)
// become subscripts; charge notation like Na+ / Mg2+ becomes superscript.
// Returns React-friendly array of strings & JSX spans.

import { Fragment } from 'react'

const SUB_MAP = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const SUP_MAP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻' }

function toSubscript(digits) {
  return digits.split('').map((d) => SUB_MAP[d] || d).join('')
}

function toSuperscript(s) {
  return s.split('').map((c) => SUP_MAP[c] || c).join('')
}

// Formula token: starts with an uppercase letter, contains at least one digit,
// is otherwise letters / digits / parens (e.g. H2SO4, NaHCO3, C6H12O6, Ca(OH)2).
const FORMULA_TOKEN = /\b[A-Z][A-Za-z0-9()]*\d[A-Za-z0-9()]*\b/g
// Digit-run that follows a letter (or closing paren) inside a formula.
const LETTER_DIGITS = /([A-Za-z)])(\d+)/g
// Charge after element/group, e.g. Na+, Cl-, Mg2+
const CHARGE = /(\b[A-Z][a-z]?\d*)\s?(\d?[+-])(?![A-Za-z0-9])/g

// Replace arrow-like sequences
function normalizeText(text) {
  if (!text) return ''
  return text
    .replace(//g, '→')         // PDF private-use arrow
    .replace(//g, '↑')
    .replace(/-->|->/g, '→')
    .replace(/<--/g, '←')
    .replace(/<=>|<->/g, '⇌')
    .replace(/\s{2,}/g, ' ')
}

function applyChem(text) {
  // Only touch tokens that look like formulas (capital-led, contain a digit).
  let out = text.replace(FORMULA_TOKEN, (token) =>
    token.replace(LETTER_DIGITS, (_, letter, digits) => `${letter}${toSubscript(digits)}`)
  )
  out = out.replace(CHARGE, (_, base, ch) => `${base}${toSuperscript(ch)}`)
  return out
}

// React-renders a string with formulas formatted.
// If `highlightTerm` provided, also wraps matches in <mark>.
export function formatChem(text, key = 0) {
  if (text == null) return null
  const normalized = normalizeText(String(text))
  const transformed = applyChem(normalized)
  return <Fragment key={key}>{transformed}</Fragment>
}

// Plain-string version (no React) — used for search matching.
export function formatChemString(text) {
  if (text == null) return ''
  return applyChem(normalizeText(String(text)))
}
