type ModalProps = {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}

export function Modal({ title, onClose, children, wide }: ModalProps) {
  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`animate-scale-in max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-surface p-6 shadow-2xl shadow-ink/20 ${
          wide ? 'max-w-2xl' : 'max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2
            id="modal-title"
            className="font-display text-2xl font-semibold text-ink"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-ink-muted transition hover:bg-mist hover:text-ink"
            aria-label="Zamknij"
          >
            Esc
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-2xl border border-line bg-fog px-4 py-3 text-ink outline-none transition placeholder:text-ink-muted/50 focus:border-leaf focus:bg-surface focus:ring-2 focus:ring-leaf/20'

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-forest px-5 py-3 text-sm font-semibold text-sand transition hover:bg-forest-deep active:scale-[0.98]'

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition hover:bg-mist active:scale-[0.98]'

export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-mist hover:text-ink'
