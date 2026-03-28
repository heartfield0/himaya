import { useNavigate } from 'react-router-dom'
import PageForm from '../../components/admin/PageForm'
import { usePages } from '../../context/usePages'
import type { CustomerPage } from '../../types/customerPage'

export default function NewPage() {
  const { createPage } = usePages()
  const navigate = useNavigate()

  const submit = async (payload: Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'>) => {
    const created = await createPage(payload)
    navigate(`/admin/pages/${created.id}/edit`)
  }

  return (
    <div className="admin-page-intro">
      <p className="eyebrow">Customer Page Studio</p>
      <h2>Create Customer Page</h2>
      <p className="muted">Create personalized QR-ready pages for each bouquet order.</p>
      <PageForm onSubmit={submit} />
    </div>
  )
}

