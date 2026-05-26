export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
        <p>Reservas online disponibles 24/7 · Confirmación por email</p>
        <p className="mt-1">Sistema Llavero &copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}
