'use client'

import { createContext, useContext } from 'react'

const BusinessLogoContext = createContext<string | null>(null)
export const BusinessLogoProvider = BusinessLogoContext.Provider
export function useBusinessLogo() {
  return useContext(BusinessLogoContext)
}
