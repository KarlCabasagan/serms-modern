import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BookMarked,
  FileText,
  Filter,
  Printer,
  Search,
  Sparkles,
  Star,
} from 'lucide-react'
import type { ReportDef } from '../types'
import { reports } from '../data/mock'
import { Badge, EmptyState } from '../components/ui'
import { PageHeader } from '../components/AppShell'

const categories: Array<'All' | ReportDef['category']> = ['All', 'Registration', 'Cashier', 'Academic', 'CHED', 'Administration']

export default function Reports({
  onToast,
}: {
  onToast: (title: string, detail?: string) => void
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof categories)[number]>('All')
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['r1', 'r6', 'r10']))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reports.filter((report) => {
      const matchesQuery = !q || `${report.name} ${report.description} ${report.category}`.toLowerCase().includes(q)
      const matchesCategory = category === 'All' || report.category === category
      return matchesQuery && matchesCategory
    })
  }, [query, category])

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function generate(report: ReportDef) {
    onToast('Report queued', `${report.name} is ready for the reporting phase. Data will come from the school database.`)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Reports & documents"
        title="Report library"
        subtitle="Official lists, forms, and receipts. Search once, then print from a consistent source."
        actions={
          <>
            <button className="btn btn--secondary" onClick={() => onToast('Print queue', 'There are no queued print jobs in the demo.')}>
              <Printer size={14} />
              Print queue
            </button>
            <button className="btn btn--primary" onClick={() => onToast('Saved reports', 'Saved report presets arrive with the database phase.')}>
              <BookMarked size={14} />
              Saved reports
            </button>
          </>
        }
      />

      <div className="card mb-4" style={{ padding: '14px 16px' }}>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div className="search-field">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reports and forms…"
              aria-label="Search reports"
            />
          </div>
          <div className="filter-chips" role="group" aria-label="Report category">
            {categories.map((item) => (
              <button
                key={item}
                className="filter-chip"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="toolbar__spacer" />
          <span className="result-count">
            <strong>{filtered.length}</strong> reports
          </span>
          <button className="icon-button icon-button--bordered" aria-label="More filters" title="More filters">
            <Filter size={15} />
          </button>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>All reports</h2>
          <p>Sorted by the way the office actually uses them</p>
        </div>
        <span className="muted" style={{ fontSize: 10 }}>
          <Sparkles size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
          {favorites.size} saved
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Search size={18} />}
            title="No reports match"
            description="Try a broader search or a different category."
            action={
              <button className="btn btn--secondary btn--sm" onClick={() => { setQuery(''); setCategory('All') }}>
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="report-grid">
          {filtered.map((report) => {
            const isFavorite = favorites.has(report.id)
            return (
              <article className="report-card" key={report.id}>
                <div className="report-card__top">
                  <span className="report-card__icon">
                    <FileText size={15} />
                  </span>
                  <button
                    className={`report-card__star ${isFavorite ? 'report-card__star--on' : ''}`}
                    onClick={() => toggleFavorite(report.id)}
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? `Remove ${report.name} from saved reports` : `Save ${report.name}`}
                  >
                    <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <h3>{report.name}</h3>
                <p>{report.description}</p>
                <div className="report-card__foot">
                  <div>
                    <span className="report-card__category">{report.category}</span>
                    <div style={{ color: '#9a8d7d', fontSize: 9, marginTop: 2 }}>Updated {report.updated}</div>
                  </div>
                  <button className="btn btn--soft btn--sm" onClick={() => generate(report)}>
                    Generate
                    <ArrowRight size={11} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <section className="card mt-4 card--flush">
        <div className="card__head" style={{ paddingBottom: 14 }}>
          <div>
            <h3>Recently generated</h3>
            <p>Reports the office opened most recently</p>
          </div>
          <Badge tone="Neutral" noDot>Demo history</Badge>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Report</th>
                <th scope="col">Generated by</th>
                <th scope="col">When</th>
                <th scope="col">Format</th>
                <th scope="col" aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {[
                ['Report of Collections', 'A. Ramirez', 'Today, 9:42 AM', 'PDF'],
                ['Certificate of Registration', 'C. Gamo', 'Today, 9:18 AM', 'PDF'],
                ['Class List · CS 201 A', 'J. Abellanosa', 'Yesterday, 4:06 PM', 'PDF'],
                ['Students with Balance', 'M. Abella', 'Yesterday, 2:21 PM', 'Excel'],
              ].map(([name, user, when, format]) => (
                <tr key={name}>
                  <td className="strong">{name}</td>
                  <td className="muted-cell">{user}</td>
                  <td className="muted-cell">{when}</td>
                  <td>
                    <Badge tone="Info" noDot>{format}</Badge>
                  </td>
                  <td className="row-actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => onToast('Report preview', `${name} will open here in the reporting phase.`)}>
                      Open
                      <ArrowRight size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
