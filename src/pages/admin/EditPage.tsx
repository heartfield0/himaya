import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PageForm from '../../components/admin/PageForm'
import { usePages } from '../../context/usePages'
import type { CustomerPage } from '../../types/customerPage'

export default function EditPage() {
  const { id } = useParams()
  const { pages, updatePage } = usePages()
  const navigate = useNavigate()
  const page = pages.find((p) => p.id === id)

  if (!page) return <Navigate to="/admin/pages" replace />

  const submit = async (payload: Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'>) => {
    await updatePage(page.id, payload)
    navigate('/admin/pages')
  }

  return (
    <div className="admin-page-intro">
      <p className="eyebrow">Customer Page Studio</p>
      <h2>Edit Customer Page</h2>
      <p className="muted">Update message content, media, and share settings.</p>
      <PageForm key={page.id} initial={page} onSubmit={submit} />
    </div>
  )
}

