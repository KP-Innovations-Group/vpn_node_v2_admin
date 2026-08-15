import { createContext, useContext, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  type: ToastType
  title?: string
  message: string
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let toastId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, ...toast }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <Toaster toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function Toaster({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto w-80 max-w-md rounded-md border border-gray-200 bg-white px-4 py-3 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              <ToastIcon type={t.type} />
            </div>
            <div className="min-w-0 flex-1">
              {t.title && <p className="text-sm font-medium">{t.title}</p>}
              <p className="text-sm text-gray-600">{t.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(t.id)}
              className="-mr-1 ml-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-4 w-4" viewBox="0 0 1024 1024" fill="currentColor">
                <path d="M190.4 190.4c-25.6 0-46.4 20.8-46.4 46.4 0 25.6 20.8 46.4 46.4 46.4h265.6l223.3 223.3c-11.2 3.2-21.6 8.8-29.6 19.2L249.6 638.4c-52.8 0-92.8 40-92.8 92.8v35.2c0 17.6 14.4 32 32 32h529.6c17.6 0 32-14.4 32-32V638.4c0-52.8-40-92.8-92.8-92.8h-35.2l-33.6 33.6c38.4 6.4 70.4 38.4 76.8 78.4H835.2c0-52.8-40-92.8-92.8-92.8h-35.2l-33.6 33.6c38.4 6.4 70.4 38.4 76.8 78.4v35.2c0 17.6 14.4 32 32 32h16c35.2 0 64-28.8 64-64v-52.8c0-35.2-28.8-64-64-64h-16c-25.6 0-46.4-20.8-46.4-46.4s20.8-46.4 46.4-46.4h16c35.2 0 64-28.8 64-64 0-25.6-14.4-46.4-40-56.8-25.6-10.4-48-32.8-48-59.2V190.4c0-43.2-8.8-84-26.4-121.6-8-17.6-24-28.8-42.4-28.8H421.6c-25.6 0-46.4 20.8-46.4 46.4v46.4h-22.4c-25.6 0-46.4 20.8-46.4 46.4 0 25.6 20.8 46.4 46.4 46.4h22.4v46.4c0 25.6 20.8 46.4 46.4 46.4h22.4v46.4c0 25.6 20.8 46.4 46.4 46.4 25.6 0 46.4-20.8 46.4-46.4v-46.4h22.4c25.6 0 46.4-20.8 46.4-46.4 0-25.6-20.8-46.4-46.4-46.4h-22.4z" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ToastIcon({ type }: { type: ToastType }) {
  const cls = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-amber-500',
  }[type]
  return (
    <svg className={`h-5 w-5 ${cls}`} fill="currentColor" viewBox="0 0 1024 1024">
      <path d="M512 64C260.8 64 64 260.8 64 512s196.8 448 448 448 448-196.8 448-448S763.2 64 512 64zm0 832c-212.8 0-384-171.2-384-384s171.2-384 384-384 384 171.2 384 384-171.2 384-384 384z" />
      {type === 'success' && (
        <path d="M716.8 358.4c25.6-25.6 25.6-67.2 0-92.8-25.6-25.6-67.2-25.6-92.8 0L422.4 566.4l-54.4-54.4c-25.6-25.6-67.2-25.6-92.8 0-25.6 25.6-25.6 67.2 0 92.8l150.4 150.4c12.8 12.8 28.8 19.2 46.4 19.2s33.6-6.4 46.4-19.2L716.8 358.4z" />
      )}
      {type === 'error' && (
        <path d="M512 64C260.8 64 64 260.8 64 512s196.8 448 448 448 448-196.8 448-448S763.2 64 512 64zm153.6 576c12.8 0 22.4-9.6 22.4-22.4 0-12.8-9.6-22.4-22.4-22.4h-38.4v-128h38.4c12.8 0 22.4-9.6 22.4-22.4 0-12.8-9.6-22.4-22.4-22.4h-166.4c-12.8 0-22.4 9.6-22.4 22.4v227.2c0 12.8 9.6 22.4 22.4 22.4h12.8v12.8c0 12.8 9.6 22.4 22.4 22.4s22.4-9.6 22.4-22.4v-38.4h64v38.4c0 12.8 9.6 22.4 22.4 22.4s22.4-9.6 22.4-22.4v-64h-64v-128h64v64c0 12.8 9.6 22.4 22.4 22.4zM512 256c17.6 0 32-14.4 32-32s-14.4-32-32-32-32 14.4-32 32 14.4 32 32 32z" />
      )}
      {type === 'warning' && (
        <path d="M512 64c-212.8 0-384 171.2-384 384s171.2 384 384 384 384-171.2 384-384-171.2-384-384-384zm0 704c-176 0-320-144-320-320s144-320 320-320 320 144 320 320-144 320-320 320zm0-448c17.6 0 32 14.4 32 32v128c0 17.6-14.4 32-32 32s-32-14.4-32-32V352c0-17.6 14.4-32 32-32zm0 256c17.6 0 32-14.4 32-32s-14.4-32-32-32-32 14.4-32 32 14.4 32 32 32z" />
      )}
      {type === 'info' && (
        <circle cx="512" cy="512" r="256" />
      )}
    </svg>
  )
}
