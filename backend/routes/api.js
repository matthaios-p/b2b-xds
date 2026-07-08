const express = require('express');
const { processQuoteRequest } = require('../controllers/aiAgentController');

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

    // Handle specific error types
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

module.exports = router;
