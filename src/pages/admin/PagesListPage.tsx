import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePages } from '../../context/usePages'
import type { CustomerPage } from '../../types/customerPage'

const fmt = (v: string | null) => (v ? new Date(v).toLocaleDateString() : '-')

function copyPageLink(slug: string) {
  void navigator.clipboard.writeText(`${window.location.origin}/m/${slug}`)
}

function PageActions({
  page,
  archivePage,
  deletePage,
  variant,
}: {
  page: CustomerPage
  archivePage: (id: string) => Promise<void>
  deletePage: (id: string) => Promise<void>
  variant: 'table' | 'card'
}) {
  const wrapClass = variant === 'card' ? 'page-card-actions' : 'row-actions'
  return (
    <div className={wrapClass}>
      <Link to={`/m/${page.slug}`} target="_blank" rel="noreferrer">
        View
      </Link>
      <Link to={`/admin/pages/${page.id}/edit`}>Edit</Link>
      <button type="button" onClick={() => void archivePage(page.id)}>
        Archive
      </button>
      <button type="button" onClick={() => void deletePage(page.id)}>
        Delete
      </button>
      <button type="button" onClick={() => copyPageLink(page.slug)}>
        Copy Link
      </button>
    </div>
  )
}

export default function PagesListPage() {
  const { pages, archivePage, deletePage, isLoading } = usePages()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return pages.filter((p) =>
      [p.recipientName, p.occasion, p.slug, p.senderName].some((value) => value.toLowerCase().includes(q)),
    )
  }, [pages, query])

  return (
    <div className="panel pages-list-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Page Manager</p>
          <h3>Customer Pages</h3>
        </div>
        <Link className="primary-btn panel-head-action" to="/admin/pages/new">
          New Page
        </Link>
      </div>

      <input
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search recipient, occasion, slug..."
      />

      <div className="pages-list-table-view table-wrap">
        <table className="pages-table">
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Occasion</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Views</th>
              <th>Created</th>
              <th>Last viewed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.recipientName}</td>
                <td>{p.occasion}</td>
                <td>{p.slug}</td>
                <td>
                  <span className={`status ${p.status}`}>{p.status}</span>
                </td>
                <td>{p.views}</td>
                <td>{fmt(p.createdAt)}</td>
                <td>{fmt(p.lastViewedAt)}</td>
                <td>
                  <PageActions page={p} archivePage={archivePage} deletePage={deletePage} variant="table" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="pages-list-cards" aria-label="Customer pages">
        {filtered.map((p) => (
          <li key={p.id} className="page-card">
            <div className="page-card-header">
              <div className="page-card-title">
                <span className="page-card-recipient">{p.recipientName}</span>
                <span className={`status ${p.status}`}>{p.status}</span>
              </div>
              <p className="page-card-occasion">{p.occasion}</p>
            </div>
            <dl className="page-card-meta">
              <div>
                <dt>Slug</dt>
                <dd>{p.slug}</dd>
              </div>
              <div>
                <dt>Views</dt>
                <dd>{p.views}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{fmt(p.createdAt)}</dd>
              </div>
              <div>
                <dt>Last viewed</dt>
                <dd>{fmt(p.lastViewedAt)}</dd>
              </div>
            </dl>
            <PageActions page={p} archivePage={archivePage} deletePage={deletePage} variant="card" />
          </li>
        ))}
      </ul>

      {isLoading ? <p className="muted">Loading pages...</p> : null}
    </div>
  )
}
