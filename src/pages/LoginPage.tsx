import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import himayaLogo from '../assets/logo/himaya-logo.png'

export default function LoginPage() {
  const [email, setEmail] = useState('admin@himaya.co')
  const [password, setPassword] = useState('himaya123')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      const redirectTo = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login')
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <img
            src={himayaLogo}
            alt="Himaya"
            className="brand-logo-login"
            decoding="async"
          />
        </div>
        <p className="eyebrow">Himaya Private Console</p>
        <h1>Admin Login</h1>
        <p className="muted">Use your private admin credentials to manage customer gift pages.</p>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="error-msg">{error}</p>}
        <button className="primary-btn" type="submit">Login to Dashboard</button>
      </form>
    </div>
  )
}

