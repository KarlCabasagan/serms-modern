import type { Enrollment, Payment, Student, Term } from './types'

export {}

interface LiveBootstrap {
  term: Term
  students: Student[]
  enrollments: Enrollment[]
  payments: Payment[]
  assessmentLines: Record<string, Array<{ code: string; label: string; amount: number }>>
  stats: {
    students: number
    enrolled: number
    unregistered: number
    balance: number
    collected: number
  }
  readOnly: boolean
}

declare global {
  interface Window {
    serms?: {
      appInfo: () => Promise<{
        name: string
        version: string
        electron: string
        platform: string
        dataMode: string
        config: { path: string; host: string; port: number; database: string } | null
      }>
      testDatabase: (credentials: { username: string; password: string }) => Promise<{
        ok: boolean
        message: string
        serverVersion?: string
        code?: string
        config?: { host: string; port: number; database: string }
        preview?: {
          students: number
          enrolled: number
          term: { sy: string; sem: string } | null
        } | null
      }>
      live: {
        connect: (
          credentials: { username: string; password: string },
        ) => Promise<({ ok: true; message?: undefined } & LiveBootstrap) | { ok: false; message: string }>
        refresh: () => Promise<({ ok: true; message?: undefined } & LiveBootstrap) | { ok: false; message: string }>
        assessment: (studid: string) => Promise<
          | { ok: true; lines: Array<{ code: string; label: string; amount: number }> }
          | { ok: false; message: string }
        >
        saveGrades: (payload: {
          sy: string
          sem: string
          rows: Array<{
            studid: string
            subjcode: string
            prelim1: string
            prelim2: string
            prelim3: string
            prelim4: string
            remarks: string
          }>
        }) => Promise<{ ok: true; updated: number } | { ok: false; message: string }>
        disconnect: () => Promise<{ ok: boolean }>
      }
    }
  }
}
