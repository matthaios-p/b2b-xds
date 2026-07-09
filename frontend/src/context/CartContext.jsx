import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    } else {
      setItems([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  async function fetchCart() {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cart`)
      setItems(res.data?.items || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  async function addItem(productId, quantity = 1, ai_custom_specs = null, unit_price = null) {
    try {
      // map to backend expected keys
      const payload = {
        product_id: productId || null,
        ai_custom_specs_json: ai_custom_specs || null,
        quantity,
      }
      if (unit_price != null) payload.unit_price = unit_price

      const res = await axios.post(`${API_BASE_URL}/api/cart`, payload)
      const added = res.data?.item
      if (added) {
        setItems((prev) => [added, ...prev])
      } else {
        await fetchCart()
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message }
    }
  }

  async function removeItem(cartItemId) {
    try {
      await axios.delete(`${API_BASE_URL}/api/cart/${cartItemId}`)
      setItems((prev) => prev.filter((i) => i.id !== cartItemId))
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message }
    }
  }

  async function updateQuantity(cartItemId, quantity) {
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/cart/${cartItemId}`, { quantity })
      const updated = res.data?.item
      if (updated) {
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
      } else {
        await fetchCart()
      }
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message }
    }
  }

  function getItemCount() {
    return items.reduce((sum, it) => sum + (it.quantity || 0), 0)
  }

  function getTotalAmount() {
    return items.reduce((sum, it) => sum + parseFloat(it.total_price || it.price || 0) * (it.quantity || 1), 0)
  }

  const value = {
    items,
    loading,
    error,
    fetchCart,
    addItem,
    removeItem,
    updateQuantity,
    getItemCount,
    getTotalAmount
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}
