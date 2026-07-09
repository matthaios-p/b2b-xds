import React, { useEffect } from 'react'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { items, loading, error, fetchCart, removeItem, updateQuantity, getTotalAmount } = useCart()

  useEffect(() => {
    fetchCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <div className="page">Loading cart...</div>
  if (error) return <div className="page">Error: {error}</div>

  return (
    <div className="page">
      <h2>Your Cart</h2>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          <ul>
            {items.map((it) => (
              <li key={it.id}>
                <strong>{it.product?.title || it.title}</strong>
                <div>Qty: {it.quantity}</div>
                <div>Price: ${it.total_price}</div>
                <button onClick={() => removeItem(it.id)}>Remove</button>
              </li>
            ))}
          </ul>

          <div>
            <h3>Total: ${getTotalAmount().toFixed(2)}</h3>
            <a href="/checkout">Proceed to Checkout</a>
          </div>
        </div>
      )}
    </div>
  )
}
