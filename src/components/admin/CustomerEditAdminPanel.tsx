import { useEffect, useState } from 'react'
import { usePages } from '../../context/usePages'
import { generateCustomerEditToken } from '../../lib/customerEditToken'
import type { CustomerPage } from '../../types/customerPage'

const LINK_EXPIRY_HOURS = 48

function buildEditUrl(slug: string, token: string) {
  return `${window.location.origin}/edit-message/${encodeURIComponent(slug)}?token=${encodeURIComponent(token)}`
}

export default function CustomerEditAdminPanel({ page }: { page: CustomerPage }) {
  const { updatePage, refresh } = usePages()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(t)
  }, [notice])

  const hasToken = Boolean(page.customerEditToken && page.customerEditToken.length >= 32)
  const editUrl = hasToken ? buildEditUrl(page.slug, page.customerEditToken!) : ''

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setNotice(null)
    try {
      await fn()
      await refresh()
    } catch (e) {
      console.error(e)
      setNotice('Something went wrong. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="customer-edit-admin-panel">
      <h3>Customer self-edit link</h3>
      <p className="muted customer-edit-admin-lead">
        Send a private link so your customer can personalize names and messages only. They never see the admin dashboard.
      </p>

      <label className="customer-edit-admin-toggle">
        <input
          type="checkbox"
          checked={page.allowCustomerEdit}
          disabled={busy}
          onChange={(e) => {
            const on = e.target.checked
            void run(async () => {
              if (on) {
                await updatePage(page.id, { allowCustomerEdit: true })
              } else {
                await updatePage(page.id, {
                  allowCustomerEdit: false,
                  customerEditToken: null,
                  customerEditExpiresAt: null,
                })
              }
            })
          }}
        />
        <span>Allow customer editing</span>
      </label>

      <div className="customer-edit-admin-actions">
        <button
          type="button"
          className="secondary-btn"
          disabled={busy || !page.allowCustomerEdit}
          onClick={() =>
            void run(async () => {
              const token = generateCustomerEditToken()
              const customerEditExpiresAt = new Date(
                Date.now() + LINK_EXPIRY_HOURS * 3600 * 1000,
              ).toISOString()
              await updatePage(page.id, {
                allowCustomerEdit: true,
                customerEditToken: token,
                customerEditExpiresAt,
              })
              await navigator.clipboard.writeText(buildEditUrl(page.slug, token))
              setNotice(`New secure link copied. It expires in about ${LINK_EXPIRY_HOURS} hours.`)
            })
          }
        >
          Generate &amp; copy link
        </button>
        <button
          type="button"
          className="ghost-btn"
          disabled={busy || !page.allowCustomerEdit || !hasToken}
          onClick={() => {
            void navigator.clipboard.writeText(editUrl).then(() => {
              setNotice('Existing link copied to clipboard.')
            })
          }}
        >
          Copy current link
        </button>
        <button
          type="button"
          className="ghost-btn customer-edit-admin-danger"
          disabled={busy || (!page.allowCustomerEdit && !hasToken)}
          onClick={() =>
            void run(async () => {
              await updatePage(page.id, {
                allowCustomerEdit: false,
                customerEditToken: null,
                customerEditExpiresAt: null,
              })
              setNotice('Customer editing is disabled and the old link no longer works.')
            })
          }
        >
          Disable customer editing
        </button>
      </div>

      {page.allowCustomerEdit && !hasToken ? (
        <p className="field-hint customer-edit-admin-hint">Generate a link to share with your customer.</p>
      ) : null}

      {page.customerEditExpiresAt && hasToken ? (
        <p className="field-hint">
          Link expiry: {new Date(page.customerEditExpiresAt).toLocaleString()} (regenerate anytime for a fresh window).
        </p>
      ) : null}

      {notice ? (
        <p className="admin-flash-inline" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  )
}
