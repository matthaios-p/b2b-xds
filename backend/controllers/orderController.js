const db = require('../db');

/**
 * Save a quote as an order in the database
 * @param {object} quoteData - The quote result from AI Agent
 * @param {number} clientId - Client ID (defaults to 1 for test client)
 * @returns {object} - The created order record
 */
async function saveQuoteToDB(quoteData, clientId = 1) {
  try {
    if (!quoteData || !quoteData.specifications || !quoteData.pricing_per_unit) {
      throw new Error('Invalid quote data structure');
    }

    const {
      specifications,
      pricing_per_unit,
      raw_prompt
    } = quoteData;

    // Validate client exists
    const client = await db.getClient(clientId);
    if (!client) {
      throw new Error(`Client with ID ${clientId} not found`);
    }

    // Prepare order data
    const rawPrompt = raw_prompt || 'Auto-generated from quote';
    const parsedDimensions = JSON.stringify({
      design_description: specifications.design_description,
      width_cm: specifications.width_cm,
      depth_cm: specifications.depth_cm,
      height_cm: specifications.height_cm,
      material_type: specifications.material_type,
      is_hollowed: specifications.is_hollowed,
      wall_thickness_cm: specifications.wall_thickness_cm,
      quantity: specifications.quantity,
    });
    const estimatedVolume = pricing_per_unit.material_volume_cm3;
    const totalCost = pricing_per_unit.total_usd;

    // Insert order using parameterized query
    const query = `
      INSERT INTO orders (client_id, raw_prompt, parsed_dimensions_json, estimated_volume, total_cost, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, client_id, raw_prompt, parsed_dimensions_json, estimated_volume, total_cost, status, created_at;
    `;

    const result = await db.query(query, [
      clientId,
      rawPrompt,
      parsedDimensions,
      estimatedVolume,
      totalCost,
      'pending'
    ]);

    const order = result.rows[0];
    console.log(`✓ Order saved successfully. Order ID: ${order.id}`);

    return {
      success: true,
      order: {
        id: order.id,
        client_id: order.client_id,
        total_cost: order.total_cost,
        estimated_volume: order.estimated_volume,
        status: order.status,
        created_at: order.created_at,
        specifications: JSON.parse(order.parsed_dimensions_json)
      }
    };

  } catch (error) {
    console.error('Error saving quote to database:', error);
    throw new Error(`Failed to save order: ${error.message}`);
  }
}

/**
 * Get all orders for a client
 * @param {number} clientId - Client ID
 * @returns {array} - List of orders
 */
async function getOrdersByClient(clientId) {
  try {
    const orders = await db.getClientOrders(clientId);
    
    return {
      success: true,
      client_id: clientId,
      orders: orders.map(order => ({
        id: order.id,
        total_cost: order.total_cost,
        estimated_volume: order.estimated_volume,
        status: order.status,
        created_at: order.created_at,
        specifications: JSON.parse(order.parsed_dimensions_json)
      }))
    };
  } catch (error) {
    console.error('Error retrieving orders:', error);
    throw new Error(`Failed to retrieve orders: ${error.message}`);
  }
}

/**
 * Update order status
 * @param {number} orderId - Order ID
 * @param {string} status - New status (pending, confirmed, processing, completed, cancelled)
 * @returns {object} - Updated order
 */
async function updateOrderStatus(orderId, status) {
  try {
    const validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const query = `
      UPDATE orders
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, client_id, total_cost, estimated_volume, status, created_at, updated_at;
    `;

    const result = await db.query(query, [status, orderId]);

    if (result.rows.length === 0) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    const order = result.rows[0];
    console.log(`✓ Order ${orderId} status updated to ${status}`);

    return {
      success: true,
      order: {
        id: order.id,
        client_id: order.client_id,
        total_cost: order.total_cost,
        estimated_volume: order.estimated_volume,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at
      }
    };

  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error(`Failed to update order: ${error.message}`);
  }
}

module.exports = {
  saveQuoteToDB,
  getOrdersByClient,
  updateOrderStatus,
};
