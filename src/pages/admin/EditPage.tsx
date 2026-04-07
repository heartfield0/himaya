import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PageForm from '../../components/admin/PageForm'
import { usePages } from '../../context/usePages'
import { EDIT_FLASH_KEY } from '../../lib/adminFlash'
import type { CustomerPage } from '../../types/customerPage'

export default function EditPage() {
  const { id } = useParams()
  const { pages, updatePage } = usePages()
  const navigate = useNavigate()
  const page = pages.find((p) => p.id === id)

  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    const msg = sessionStorage.getItem(EDIT_FLASH_KEY)
    if (msg) {
      setFlash(msg)
      sessionStorage.removeItem(EDIT_FLASH_KEY)
    } else {
      setFlash(null)
    }
  }, [id])

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 4500)
    return () => window.clearTimeout(t)
  }, [flash])

  if (!page) return <Navigate to="/admin/pages" replace />

  const submit = async (payload: Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'>) => {
    await updatePage(page.id, payload)
    navigate('/admin/pages')
  }

  return (
    <div className="admin-page-intro">
      {flash ? (
        <p className="admin-flash-banner" role="status">
          {flash}
        </p>
      ) : null}
      <p className="eyebrow">Customer Page Studio</p>
      <h2>Edit Customer Page</h2>
      <p className="muted">Update message content, media, and share settings.</p>
      <PageForm key={page.id} initialCustomerPage={page} enableSaveAsTemplate onSubmit={submit} />
    </div>
  )
}

