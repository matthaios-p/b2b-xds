const db = require('../db');

/**
 * Get all cart items for the logged-in user
 */
async function getCart(req, res) {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const q = `
      SELECT ci.id, ci.user_id, ci.product_id, ci.ai_custom_specs_json, ci.quantity, ci.total_price,
             p.title AS product_title, p.base_price
      FROM cart_items ci
      LEFT JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = $1
      ORDER BY ci.id DESC
    `;

    const result = await db.query(q, [userId]);
    return res.json({ success: true, items: result.rows });
  } catch (error) {
    console.error('getCart error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch cart' });
  }
}

/**
 * Add an item to the cart. Supports catalog products (product_id) and AI custom items (ai_custom_specs_json).
 * Body: { product_id?: integer, ai_custom_specs_json?: object, quantity?: integer, unit_price?: numeric }
 */
async function addToCart(req, res) {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const { product_id, ai_custom_specs_json } = req.body;
    let quantity = parseInt(req.body.quantity, 10) || 1;
    if (quantity < 1) quantity = 1;

    let unitPrice = null; // per-item price

    if (product_id) {
      // Fetch product base price
      const pRes = await db.query('SELECT id, base_price FROM products WHERE id = $1', [product_id]);
      if (!pRes.rows.length) return res.status(400).json({ success: false, error: 'Product not found' });
      unitPrice = Number(pRes.rows[0].base_price) || 0;
    } else if (ai_custom_specs_json) {
      // Try to extract a price from the payload or accept unit_price in body
      if (req.body.unit_price) {
        unitPrice = Number(req.body.unit_price) || 0;
      } else if (ai_custom_specs_json.estimated_unit_price) {
        unitPrice = Number(ai_custom_specs_json.estimated_unit_price) || 0;
      } else if (ai_custom_specs_json.total_price && Number(ai_custom_specs_json.total_price) && quantity) {
        unitPrice = Number(ai_custom_specs_json.total_price) / quantity;
      } else {
        unitPrice = 0; // fallback
      }
    } else {
      return res.status(400).json({ success: false, error: 'Either product_id or ai_custom_specs_json must be provided' });
    }

    const totalPrice = unitPrice * quantity;

    const insertQ = `
      INSERT INTO cart_items (user_id, product_id, ai_custom_specs_json, quantity, total_price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const insertParams = [userId, product_id || null, ai_custom_specs_json || null, quantity, totalPrice];
    const insertRes = await db.query(insertQ, insertParams);

    return res.status(201).json({ success: true, item: insertRes.rows[0] });
  } catch (error) {
    console.error('addToCart error:', error);
    return res.status(500).json({ success: false, error: 'Failed to add item to cart' });
  }
}

/**
 * Update quantity for a cart item. Body: { quantity: number }
 */
async function updateCartItem(req, res) {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const itemId = req.params.id;
    let { quantity } = req.body;
    quantity = parseInt(quantity, 10);
    if (!quantity || quantity < 1) return res.status(400).json({ success: false, error: 'Invalid quantity' });

    // Fetch existing item to compute unit price
    const sel = await db.query('SELECT quantity, total_price, product_id FROM cart_items WHERE id = $1 AND user_id = $2', [itemId, userId]);
    if (!sel.rows.length) return res.status(404).json({ success: false, error: 'Cart item not found' });

    const existing = sel.rows[0];
    const oldQty = Number(existing.quantity) || 1;
    const oldTotal = Number(existing.total_price) || 0;
    let unitPrice = 0;

    if (oldQty > 0) unitPrice = oldTotal / oldQty;

    // If this item references a product, prefer using product.base_price (in case prices changed)
    if (existing.product_id) {
      const pRes = await db.query('SELECT base_price FROM products WHERE id = $1', [existing.product_id]);
      if (pRes.rows.length) unitPrice = Number(pRes.rows[0].base_price) || unitPrice;
    }

    const newTotal = unitPrice * quantity;

    const updateQ = 'UPDATE cart_items SET quantity = $1, total_price = $2 WHERE id = $3 AND user_id = $4 RETURNING *';
    const updateRes = await db.query(updateQ, [quantity, newTotal, itemId, userId]);

    return res.json({ success: true, item: updateRes.rows[0] });
  } catch (error) {
    console.error('updateCartItem error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update cart item' });
  }
}

/**
 * Remove an item from the cart
 */
async function removeFromCart(req, res) {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const itemId = req.params.id;
    const del = await db.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id', [itemId, userId]);
    if (!del.rows.length) return res.status(404).json({ success: false, error: 'Cart item not found' });
    return res.json({ success: true, id: del.rows[0].id });
  } catch (error) {
    console.error('removeFromCart error:', error);
    return res.status(500).json({ success: false, error: 'Failed to remove cart item' });
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
};
