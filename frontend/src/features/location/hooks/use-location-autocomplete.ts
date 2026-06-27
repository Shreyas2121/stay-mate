import { useCallback, useEffect, useRef, useState } from 'react'

import type { LocationSearchResult } from '../types/location.types'

interface UseLocationAutocompleteOptions {
  debounceMs?: number
  limit?: number
  minQueryLength?: number
}

const DEFAULT_DEBOUNCE_MS = 600
const DEFAULT_LIMIT = 5
const DEFAULT_MIN_QUERY_LENGTH = 3

export function useLocationAutocomplete({
  debounceMs = DEFAULT_DEBOUNCE_MS,
  limit = DEFAULT_LIMIT,
  minQueryLength = DEFAULT_MIN_QUERY_LENGTH,
}: UseLocationAutocompleteOptions = {}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const clearPendingSearch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    abortControllerRef.current?.abort()
  }, [])

  const hideResults = useCallback(() => {
    setShowResults(false)
  }, [])

  const showExistingResults = useCallback(() => {
    setShowResults(results.length > 0)
  }, [results.length])

  const resetResults = useCallback(() => {
    setResults([])
    setShowResults(false)
  }, [])

  const search = useCallback(
    (value: string) => {
      setQuery(value)
      clearPendingSearch()

      if (value.trim().length < minQueryLength) {
        resetResults()
        return
      }

      debounceRef.current = setTimeout(async () => {
        const controller = new AbortController()
        abortControllerRef.current = controller
        setIsSearching(true)

        try {
          const params = new URLSearchParams({
            q: value,
            format: 'json',
            limit: String(limit),
          })

          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?${params.toString()}`,
            { signal: controller.signal },
          )
          const data = (await res.json()) as LocationSearchResult[]
          setResults(data)
          setShowResults(data.length > 0)
        } catch (error) {
          if (!(error instanceof DOMException && error.name === 'AbortError')) {
            resetResults()
          }
        } finally {
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null
          }
          setIsSearching(false)
        }
      }, debounceMs)
    },
    [clearPendingSearch, debounceMs, limit, minQueryLength, resetResults],
  )

  const selectResult = useCallback(
    (result: LocationSearchResult) => {
      setQuery(result.display_name)
      hideResults()
    },
    [hideResults],
  )

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        hideResults()
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [hideResults])

  useEffect(() => {
    return () => clearPendingSearch()
  }, [clearPendingSearch])

  return {
    containerRef,
    hideResults,
    isSearching,
    query,
    results,
    search,
    selectResult,
    setQuery,
    showExistingResults,
    showResults,
  }
}
