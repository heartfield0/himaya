import himayaMark from '../../../assets/logo/himaya-mark.png'
import type { PrintCardTemplateId } from '../../../types/customerPage'
import { DEFAULT_PRINT_CARD_FORMAT } from '../../../types/printCard'

export type PrintCardFaceProps = {
  templateId: PrintCardTemplateId
  qrDataUrl: string | null
  subtext: string
  recipientLine: string
}

const { widthPx: W, heightPx: H } = DEFAULT_PRINT_CARD_FORMAT

/** Fixed scan CTA — optimized for tiny physical tags. */
export const PRINT_TAG_CTA = 'Scan for your surprise 💌'

/** Large QR for reliable scans when printed small. */
const QR_DISPLAY = 400

export function PrintCardFace(props: PrintCardFaceProps) {
  const { templateId, qrDataUrl, subtext, recipientLine } = props
  const subShown = subtext.trim()

  return (
    <div
      className="print-card-face print-card-insert print-card-insert--stack"
      style={{ width: W, height: H }}
      data-print-format={DEFAULT_PRINT_CARD_FORMAT.id}
      data-insert-style={templateId}
    >
      <div className="print-card-punch-safe" aria-hidden />

      <div className="print-card-stack">
        <img
          src={himayaMark}
          alt=""
          className="print-card-stack-logo"
          width={56}
          height={56}
        />

        <div className="print-card-action-block">
          <h1 className="print-card-stack-cta">{PRINT_TAG_CTA}</h1>
          <div className="print-card-qr-wrap print-card-qr-wrap--stack">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt=""
                className="print-card-qr-img print-card-qr-img--stack"
                width={QR_DISPLAY}
                height={QR_DISPLAY}
              />
            ) : (
              <div className="print-card-qr-placeholder print-card-qr-placeholder--stack">Generating QR…</div>
            )}
          </div>
        </div>

        <p className="print-card-stack-recipient">For {recipientLine}</p>
        {subShown ? <p className="print-card-stack-sub">{subShown}</p> : null}
      </div>
    </div>
  )
}
