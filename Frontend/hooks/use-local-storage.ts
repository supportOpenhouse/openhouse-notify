import { useState, useCallback } from "react"

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const toStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(toStore)
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(toStore))
        }
      } catch (e) {
        console.warn(`useLocalStorage: failed to set "${key}"`, e)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue]
}
