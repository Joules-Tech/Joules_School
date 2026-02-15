export default function HomePage() {
  return (
    <main className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Joules School Rojmel
        </h1>
        <p className="max-w-2xl text-sm text-gray-600">
          Multi-tenant rojmel and cashbook management for schools. Secure,
          role-based access for owners, accountants, and viewers.
        </p>
      </section>
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Login
        </a>
        <a
          href="/auth/signup"
          className="inline-flex items-center justify-center rounded-md border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Sign up
        </a>
      </section>
    </main>
  )
}
