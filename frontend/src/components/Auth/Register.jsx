import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, { name, email, password })
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        navigate('/')
      } else {
        setError('Invalid response from server')
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <h2>Create an account</h2>
      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="error">{error}</p>}

        <div className="actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating...' : 'Register'}
          </button>
          <Link to="/login" className="btn btn-secondary">Already have an account?</Link>
        </div>
      </form>
    </div>
  )
}
