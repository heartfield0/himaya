import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageForm from '../../components/admin/PageForm'
import TemplatePickerModal from '../../components/admin/TemplatePickerModal'
import { usePages } from '../../context/usePages'
import { templateToNewPageFormState, type CustomerPageFormState } from '../../lib/pageTemplateMapping'
import type { CustomerPage } from '../../types/customerPage'
import type { PageTemplate } from '../../types/pageTemplate'

export default function NewPage() {
  const { createPage } = usePages()
  const navigate = useNavigate()
  const [formKey, setFormKey] = useState(0)
  const [templateSeed, setTemplateSeed] = useState<CustomerPageFormState | undefined>(undefined)
  const [pickerOpen, setPickerOpen] = useState(false)

  const submit = async (payload: Omit<CustomerPage, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'lastViewedAt'>) => {
    const created = await createPage(payload)
    navigate(`/admin/pages/${created.id}/edit`)
  }

  const applyTemplate = (t: PageTemplate) => {
    setTemplateSeed(templateToNewPageFormState(t))
    setFormKey((k) => k + 1)
    setPickerOpen(false)
  }

  return (
    <div className="admin-page-intro">
      <p className="eyebrow">Customer Page Studio</p>
      <h2>Create Customer Page</h2>
      <p className="muted">Create personalized QR-ready pages for each bouquet order.</p>

      <div className="new-page-template-row">
        <button type="button" className="secondary-btn new-page-from-template-btn" onClick={() => setPickerOpen(true)}>
          Create from Template
        </button>
        <span className="muted new-page-template-hint">Reuse a saved layout and copy, then set slug and names.</span>
      </div>

      <TemplatePickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={applyTemplate} />

      <PageForm key={formKey} initialFormSeed={templateSeed} onSubmit={submit} />
    </div>
  )
}
