import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePages } from '../../context/usePages'

const fmt = (v: string | null) => (v ? new Date(v).toLocaleDateString() : '-')

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
    <div className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Page Manager</p>
          <h3>Customer Pages</h3>
        </div>
        <Link className="primary-btn" to="/admin/pages/new">New Page</Link>
      </div>

      <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipient, occasion, slug..." />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Recipient</th><th>Occasion</th><th>Slug</th><th>Status</th><th>Views</th><th>Created</th><th>Last viewed</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.recipientName}</td>
                <td>{p.occasion}</td>
                <td>{p.slug}</td>
                <td><span className={`status ${p.status}`}>{p.status}</span></td>
                <td>{p.views}</td>
                <td>{fmt(p.createdAt)}</td>
                <td>{fmt(p.lastViewedAt)}</td>
                <td>
                  <div className="row-actions">
                    <Link to={`/m/${p.slug}`} target="_blank">View</Link>
                    <Link to={`/admin/pages/${p.id}/edit`}>Edit</Link>
                    <button onClick={async () => archivePage(p.id)}>Archive</button>
                    <button onClick={async () => deletePage(p.id)}>Delete</button>
                    <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/m/${p.slug}`)}>Copy Link</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="muted">Loading pages...</p>}
      </div>
    </div>
  )
}

