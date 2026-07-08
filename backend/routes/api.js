const express = require('express');
const { processQuoteRequest } = require('../controllers/aiAgentController');
const { saveQuoteToDB, getOrdersByClient, updateOrderStatus } = require('../controllers/orderController');

const router = express.Router();

/**
 * POST /api/quote
 * Accepts natural language input and returns quote with structured specifications and pricing
 * 
 * Request body:
 * {
 *   "prompt": "I need 3D printed letters for 'CAFE', 50cm height, 5cm depth, hollowed"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "specifications": {...},
 *   "pricing_per_unit": {...},
 *   "pricing_total": {...}
 * }
 */
router.post('/quote', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Please provide a "prompt" field with your requirements.'
      });
    }

    const result = await processQuoteRequest(prompt.trim());

    return res.status(200).json(result);

  } catch (error) {
    console.error('Quote API Error:', error);

    if (error.message.includes('API key')) {
      return res.status(500).json({
        success: false,
        error: 'AI service configuration error. Please contact support.'
      });
    }

    if (error.message.includes('JSON')) {
      return res.status(400).json({
        success: false,
        error: 'Could not parse your request. Please provide clearer specifications.'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing your quote request.'
    });
  }
});

/**
 * POST /api/orders
 * Saves a quote as an order in the database
 * 
 * Request body:
 * {
 *   "prompt": "I need 3D printed letters for 'CAFE', 50cm height, 5cm depth, hollowed",
 *   "clientId": 1 (optional, defaults to 1)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "order": { id, client_id, total_cost, status, created_at, ... }
 * }
 */
router.post('/orders', async (req, res) => {
  try {
    const { prompt, clientId = 1 } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Please provide a "prompt" field with your requirements.'
      });
    }

    // Generate quote
    const quoteResult = await processQuoteRequest(prompt.trim());

    if (!quoteResult.success) {
      return res.status(400).json(quoteResult);
    }

    // Save to database
    const orderData = {
      ...quoteResult,
      raw_prompt: prompt.trim()
    };
    const orderResult = await saveQuoteToDB(orderData, clientId);

    return res.status(201).json(orderResult);

  } catch (error) {
    console.error('Orders API Error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while processing your order.'
    });
  }
});

/**
 * GET /api/orders/:clientId
 * Retrieves all orders for a specific client
 * 
 * Response:
 * {
 *   "success": true,
 *   "client_id": 1,
 *   "orders": [...]
 * }
 */
router.get('/orders/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId || isNaN(clientId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client ID. Please provide a valid numeric ID.'
      });
    }

    const result = await getOrdersByClient(parseInt(clientId));
    return res.status(200).json(result);

  } catch (error) {
    console.error('Get Orders API Error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while retrieving orders.'
    });
  }
});

/**
 * PATCH /api/orders/:orderId/status
 * Updates the status of an order
 * 
 * Request body:
 * {
 *   "status": "confirmed" // pending, confirmed, processing, completed, cancelled
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "order": { id, status, updated_at, ... }
 * }
 */
router.patch('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID. Please provide a valid numeric ID.'
      });
    }

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Please provide a "status" field.'
      });
    }

    const result = await updateOrderStatus(parseInt(orderId), status.toLowerCase());
    return res.status(200).json(result);

  } catch (error) {
    console.error('Update Order Status API Error:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while updating the order.'
    });
  }
});

module.exports = router;
