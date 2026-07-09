import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'
import { useCart } from '../../context/CartContext'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { getItemCount } = useCart()

  const count = isAuthenticated ? getItemCount() : 0

  return (
    <nav className="app-nav">
      <div className="nav-left">
        <Link to="/" className="brand">B2B Signage</Link>
      </div>

      <div className="nav-right">
        {!isAuthenticated ? (
          <>
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        ) : (
          <>
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/cart" className="nav-link">Cart {count > 0 && <span className="cart-badge">{count}</span>}</Link>
            <span className="nav-user">Hello, {user?.name || user?.email || 'User'}</span>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  )
}
