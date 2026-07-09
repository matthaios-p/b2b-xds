import { useState } from 'react'
import axios from 'axios'
import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Layout/Navbar'

function Home() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!prompt.trim()) {
      setError('Please enter your requirements')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await axios.post(`${API_BASE_URL}/api/quote`, {
        prompt: prompt.trim()
      })

      if (response.data.success) {
        setResult(response.data)
      } else {
        setError(response.data.error || 'Failed to process quote')
      }
    } catch (err) {
      console.error('Error:', err)
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to connect to the server. Make sure the backend is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setPrompt('')
    setResult(null)
    setError(null)
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <h1>🖨️ B2B Signage Cost Calculator</h1>
          <p>Get instant quotes for 3D-printed signage using AI</p>
        </div>
      </header>

      <main className="main-content">
        <div className="calculator-section">
          <div className="input-card">
            <h2>Describe Your Project</h2>
            <p className="subtitle">
              Tell us what you need in natural language. Our AI will extract specifications and calculate the cost.
            </p>

            <form onSubmit={handleSubmit}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: I need 3D printed letters spelling 'CAFE', 50cm height, 5cm depth, hollowed out inside with custom font"
                disabled={loading}
                rows={6}
                className="textarea"
              />

              <div className="button-group">
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Calculating...
                    </>
                  ) : (
                    <>
                      💰 Get Quote
                    </>
                  )}
                </button>

                {(prompt || result) && (
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={loading}
                    className="btn btn-secondary"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {error && (
            <div className="error-card">
              <h3>⚠️ Error</h3>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="results-card">
              <h2>📊 Quote Summary</h2>

              {/* Specifications Section */}
              <div className="results-section">
                <h3>Design Specifications</h3>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span className="label">Design:</span>
                    <span className="value">{result.specifications.design_description}</span>
                  </div>
                  <div className="spec-item">
                    <span className="label">Dimensions:</span>
                    <span className="value">
                      {result.specifications.width_cm}cm W × {result.specifications.depth_cm}cm D × {result.specifications.height_cm}cm H
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="label">Material:</span>
                    <span className="value">{result.specifications.material_type}</span>
                  </div>
                  <div className="spec-item">
                    <span className="label">Design Type:</span>
                    <span className="value">
                      {result.specifications.is_hollowed ? '🔲 Hollowed' : '🔷 Solid'}
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="label">Quantity:</span>
                    <span className="value">{result.specifications.quantity} unit(s)</span>
                  </div>
                  {result.specifications.notes && (
                    <div className="spec-item">
                      <span className="label">Notes:</span>
                      <span className="value">{result.specifications.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Material Volume Section */}
              <div className="results-section">
                <h3>Material Analysis</h3>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span className="label">Actual Volume:</span>
                    <span className="value">{result.pricing_per_unit.material_volume_cm3} cm³</span>
                  </div>
                  <div className="spec-item">
                    <span className="label">With Waste Factor (15%):</span>
                    <span className="value">{result.pricing_per_unit.material_volume_with_waste_cm3} cm³</span>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="results-section">
                <h3>Cost Breakdown (Per Unit)</h3>
                <div className="pricing-table">
                  <div className="price-row">
                    <span className="price-label">Base Setup Cost:</span>
                    <span className="price-value">${result.pricing_per_unit.base_cost_usd.toFixed(2)}</span>
                  </div>
                  <div className="price-row">
                    <span className="price-label">Material Cost:</span>
                    <span className="price-value">${result.pricing_per_unit.material_cost_usd.toFixed(2)}</span>
                  </div>
                  <div className="price-row">
                    <span className="price-label">Labor Cost:</span>
                    <span className="price-value">${result.pricing_per_unit.labor_cost_usd.toFixed(2)}</span>
                  </div>
                  <div className="price-row">
                    <span className="price-label">Subtotal:</span>
                    <span className="price-value">${result.pricing_per_unit.subtotal_usd.toFixed(2)}</span>
                  </div>
                  <div className="price-row">
                    <span className="price-label">Business Markup ({result.pricing_per_unit.markup_percentage.toFixed(0)}%):</span>
                    <span className="price-value">
                      +${(result.pricing_per_unit.total_usd - result.pricing_per_unit.subtotal_usd).toFixed(2)}
                    </span>
                  </div>
                  <div className="price-row highlight">
                    <span className="price-label">Unit Price:</span>
                    <span className="price-value">${result.pricing_per_unit.total_usd.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Total Cost */}
              {result.specifications.quantity > 1 && (
                <div className="results-section">
                  <div className="total-cost">
                    <span>Total for {result.specifications.quantity} Units:</span>
                    <span className="total-amount">${result.pricing_total.total_usd.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="results-footer">
                <p>💡 This quote is generated based on AI interpretation of your description. Contact us for detailed review before finalizing.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>© 2024 B2B Signage Cost Calculator. Powered by React + OpenAI</p>
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
