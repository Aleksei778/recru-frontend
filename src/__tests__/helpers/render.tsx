import React, { ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Expose router spies so tests can assert on navigation calls
export function getMockRouter() {
    const nav = require('next/navigation')
    return nav.useRouter()
}

export const mockPush = vi.fn()
export const mockReplace = vi.fn()

function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(React.Fragment, null, children)
}

export function renderWithProviders(ui: React.ReactElement, options?: RenderOptions) {
    return render(ui, { wrapper: Wrapper, ...options })
}
