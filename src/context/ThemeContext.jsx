import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  // Initialize with localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  // Set the body class whenever theme changes
  useEffect(() => {
    document.body.className = theme
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    
    // Update State
    setTheme(newTheme)
    
    // Update Local Storage
    localStorage.setItem("theme", newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
