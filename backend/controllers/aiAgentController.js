const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Pricing formula constants (can be adjusted based on business logic)
const PRICING_CONSTANTS = {
  base_cost: 50, // Base cost in USD
  cost_per_cm3: 0.15, // Cost per cubic centimeter of material
  labor_per_cm_height: 5, // Labor cost per cm of height
  complexity_multiplier_hollow: 1.3, // 30% markup for hollowed designs
  material_waste_multiplier: 1.15, // 15% waste factor
  markup_percentage: 0.25 // 25% business markup
};

/**
 * Calculate material volume and apply pricing formula
 * @param {object} specs - Dimensions and properties
 * @returns {object} - Pricing breakdown
 */
function calculatePricing(specs) {
  const {
    width_cm = 0,
    depth_cm = 0,
    height_cm = 0,
    material_type = 'resin',
    is_hollowed = false,
    wall_thickness_cm = 0.3
  } = specs;

  // Calculate gross volume
  const gross_volume_cm3 = width_cm * depth_cm * height_cm;

  // Calculate hollow volume (if applicable)
  let net_volume_cm3 = gross_volume_cm3;
  if (is_hollowed) {
    const inner_width = Math.max(0, width_cm - 2 * wall_thickness_cm);
    const inner_depth = Math.max(0, depth_cm - 2 * wall_thickness_cm);
    const inner_height = Math.max(0, height_cm - 2 * wall_thickness_cm);
    const hollow_volume = inner_width * inner_depth * inner_height;
    net_volume_cm3 = gross_volume_cm3 - Math.max(0, hollow_volume);
  }

  // Apply waste multiplier
  const material_volume_with_waste = net_volume_cm3 * PRICING_CONSTANTS.material_waste_multiplier;

  // Material cost
  const material_cost = material_volume_with_waste * PRICING_CONSTANTS.cost_per_cm3;

  // Labor cost (based on height and complexity)
  let labor_cost = height_cm * PRICING_CONSTANTS.labor_per_cm_height;
  if (is_hollowed) {
    labor_cost *= PRICING_CONSTANTS.complexity_multiplier_hollow;
  }

  // Base cost
  const subtotal = PRICING_CONSTANTS.base_cost + material_cost + labor_cost;

  // Apply markup
  const total_before_tax = subtotal * (1 + PRICING_CONSTANTS.markup_percentage);

  return {
    material_volume_cm3: Math.round(material_volume_cm3 * 100) / 100,
    material_volume_with_waste_cm3: Math.round(material_volume_with_waste * 100) / 100,
    material_cost_usd: Math.round(material_cost * 100) / 100,
    labor_cost_usd: Math.round(labor_cost * 100) / 100,
    base_cost_usd: PRICING_CONSTANTS.base_cost,
    subtotal_usd: Math.round(subtotal * 100) / 100,
    markup_percentage: PRICING_CONSTANTS.markup_percentage * 100,
    total_usd: Math.round(total_before_tax * 100) / 100
  };
}

/**
 * Parse natural language input using OpenAI API
 * @param {string} prompt - User's natural language description
 * @returns {object} - Parsed specifications and pricing
 */
async function processQuoteRequest(prompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  try {
    const systemPrompt = `You are an expert in 3D printing and signage production. Extract precise specifications from the user's natural language request and return a JSON object.

Extract and infer the following:
1. Text/Design description (what is being printed)
2. Width in cm (estimate from description if not explicit)
3. Depth in cm (thickness of the letters/design)
4. Height in cm (vertical dimension)
5. Material type (resin, nylon, plastic - default: resin)
6. Is hollowed (true/false - default: false for letters)
7. Wall thickness in cm for hollow designs (default: 0.3)
8. Estimated number of units

Return ONLY a valid JSON object with these keys:
{
  "design_description": string,
  "width_cm": number,
  "depth_cm": number,
  "height_cm": number,
  "material_type": string,
  "is_hollowed": boolean,
  "wall_thickness_cm": number,
  "quantity": number,
  "notes": string
}

Be conservative with estimates - when uncertain, assume standard sizing.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const specs = JSON.parse(jsonMatch[0]);

    // Validate and sanitize specs
    const validatedSpecs = {
      design_description: specs.design_description || 'Custom design',
      width_cm: Math.max(1, parseFloat(specs.width_cm) || 10),
      depth_cm: Math.max(1, parseFloat(specs.depth_cm) || 5),
      height_cm: Math.max(1, parseFloat(specs.height_cm) || 50),
      material_type: specs.material_type || 'resin',
      is_hollowed: specs.is_hollowed === true || specs.is_hollowed === 'true',
      wall_thickness_cm: Math.max(0.2, parseFloat(specs.wall_thickness_cm) || 0.3),
      quantity: Math.max(1, parseInt(specs.quantity) || 1),
      notes: specs.notes || ''
    };

    // Calculate pricing for single unit
    const pricing = calculatePricing(validatedSpecs);

    return {
      success: true,
      specifications: validatedSpecs,
      pricing_per_unit: pricing,
      pricing_total: {
        ...pricing,
        total_usd: Math.round(pricing.total_usd * validatedSpecs.quantity * 100) / 100,
        quantity: validatedSpecs.quantity
      }
    };

  } catch (error) {
    console.error('AI Agent Error:', error);
    throw error;
  }
}

module.exports = {
  processQuoteRequest,
  calculatePricing
};
