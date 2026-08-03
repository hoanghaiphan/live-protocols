export type ToastKind = 'info' | 'ok' | 'error'

function ensureHost(): HTMLElement {
  let host = document.getElementById('lp-toasts')
  if (!host) {
    host = document.createElement('div')
    host.id = 'lp-toasts'
    host.className = 'toast-host'
    host.setAttribute('aria-live', 'polite')
    host.setAttribute('aria-relevant', 'additions')
    document.body.appendChild(host)
  }
  return host
}

/** Soft feedback that survives full #app re-renders. Prefer over alert(). */
export function showToast(message: string, kind: ToastKind = 'info'): void {
  const host = ensureHost()
  const el = document.createElement('div')
  el.className = `toast toast-${kind}`
  el.setAttribute('role', kind === 'error' ? 'alert' : 'status')
  el.textContent = message
  host.appendChild(el)

  window.setTimeout(() => el.classList.add('toast-out'), 2600)
  window.setTimeout(() => el.remove(), 3100)
}
