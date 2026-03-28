import { Link } from 'react-router-dom'
import { usePages } from '../../context/usePages'

const dateFmt = (value: string | null) => (value ? new Date(value).toLocaleString() : 'Never')

export default function DashboardPage() {
  const { pages } = usePages()
  const metrics = {
    totalPages: pages.length,
    activePages: pages.filter((p) => p.status === 'active').length,
    archivedPages: pages.filter((p) => p.status === 'archived').length,
    totalViews: pages.reduce((acc, page) => acc + page.views, 0),
  }
  const recent = pages
    .filter((p) => p.lastViewedAt)
    .sort((a, b) => (b.lastViewedAt ?? '').localeCompare(a.lastViewedAt ?? ''))
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      recipientName: p.recipientName,
      viewedAt: p.lastViewedAt ?? '',
    }))
  const mostViewed = [...pages].sort((a, b) => b.views - a.views).slice(0, 5)

  return (
    <div className="dashboard-grid">
      <div className="metric-card"><p>Total pages</p><h2>{metrics.totalPages}</h2><small>All customer experiences</small></div>
      <div className="metric-card"><p>Active pages</p><h2>{metrics.activePages}</h2><small>Currently live and scannable</small></div>
      <div className="metric-card"><p>Archived pages</p><h2>{metrics.archivedPages}</h2><small>Stored gift records</small></div>
      <div className="metric-card"><p>Total scans/views</p><h2>{metrics.totalViews}</h2><small>Lifetime recipient opens</small></div>

      <section className="panel wide">
        <div className="panel-head">
          <h3>Most Viewed Pages</h3>
          <Link to="/admin/pages">Manage pages</Link>
        </div>
        <ul className="list-simple">
          {mostViewed.map((p) => (
            <li key={p.id}><span>{p.recipientName} - {p.occasion}</span><strong>{p.views} views</strong></li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h3>Recent Page Visits</h3>
        <ul className="list-simple">
          {recent.length ? recent.map((entry) => (
            <li key={entry.id}><span>{entry.recipientName}</span><small>{dateFmt(entry.viewedAt)}</small></li>
          )) : <li>No visits yet.</li>}
        </ul>
      </section>

      <section className="panel">
        <h3>Status Summary</h3>
        <ul className="list-simple">
          <li><span>Draft</span><strong>{pages.filter((p) => p.status === 'draft').length}</strong></li>
          <li><span>Active</span><strong>{pages.filter((p) => p.status === 'active').length}</strong></li>
          <li><span>Archived</span><strong>{pages.filter((p) => p.status === 'archived').length}</strong></li>
        </ul>
      </section>
    </div>
  )
}

