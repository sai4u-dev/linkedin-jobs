import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login from './components/Login.jsx'
import Shell from './components/Shell.jsx'
import Icon from './components/Icon.jsx'

function Gate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="boot-screen">
        <div className="brand brand--lg">
          <span className="brand-mark">
            <Icon name="target" size={24} strokeWidth={2} />
          </span>
          <span className="brand-name">
            Job<span>Lens</span>
          </span>
        </div>
        <div className="boot-bar">
          <span />
        </div>
        <p>Restoring your admin session…</p>
      </div>
    )
  }

  return user ? <Shell /> : <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
