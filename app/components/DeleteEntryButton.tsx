'use client'

interface DeleteEntryButtonProps {
  id: string
  action: (formData: FormData) => Promise<void>
  lang: 'en' | 'gu'
}

export default function DeleteEntryButton({ id, action, lang }: DeleteEntryButtonProps) {
  const confirmMsg =
    lang === 'gu'
      ? 'શું તમે ખરેખર આ નોંધ કાઢી નાખવા માંગો છો?'
      : 'Are you sure you want to delete this entry? This cannot be undone.'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!confirm(confirmMsg)) {
      e.preventDefault()
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        {lang === 'gu' ? 'કાઢી નાખો' : 'Delete Entry'}
      </button>
    </form>
  )
}
