import React from 'react'
import { useCart } from '../context/CartContext'

export default function Checkout() {
  const { items, getTotalAmount } = useCart()

  return (
    <div className="page">
      <h2>Checkout</h2>
      {items.length === 0 ? (
        <p>Your cart is empty. Add items before checking out.</p>
      ) : (
        <div>
          <p>Order summary:</p>
          <ul>
            {items.map((it) => (
              <li key={it.id}>{it.product?.title || it.title} × {it.quantity} — ${it.total_price}</li>
            ))}
          </ul>

          <h3>Total: ${getTotalAmount().toFixed(2)}</h3>
          <button disabled>Place Order (placeholder)</button>
        </div>
      )}
    </div>
  )
}
