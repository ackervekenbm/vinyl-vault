import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

// React act() support for @testing-library/react under Vitest.
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// @testing-library/react can't auto-register its cleanup without a global
// afterEach; Vitest runs with globals disabled here.
afterEach(() => {
  cleanup()
})