# B2B Signage Cost Calculator

A full-stack web application for calculating costs and managing orders for industrial 3D-printed signage. Uses React frontend, Node.js/Express backend, PostgreSQL database, and OpenAI API for intelligent quote generation.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (5173)                 │
│              (Vite Dev Server + Axios Client)            │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP (CORS enabled)
                     ▼
┌─────────────────────────────────────────────────────────┐
│               Node.js/Express Backend (5000)             │
│                                                          │
│  POST /api/quote                                         │
│    ├─ Parse natural language request                     │
│    ├─ Call OpenAI API (GPT-4 Turbo)                      │
│    ├─ Extract structured JSON specifications            │
│    ├─ Calculate pricing formula                         │
│    └─ Return comprehensive quote                        │
└────────┬────────────────────────────────────────────────┘
         │
         ├──► OpenAI API (Cloud)
         │
         └──► PostgreSQL Database (5432) [Optional]
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- Node.js 18+ (if running locally)
- OpenAI API Key (get one at https://platform.openai.com/api-keys)

### Setup with Docker (Recommended)

1. **Clone and navigate to project:**
   ```bash
   cd b2b-xds
   ```

2. **Create environment file:**
   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Add your OpenAI API key:**
   ```bash
   # Edit backend/.env and set OPENAI_API_KEY
   nano backend/.env
   ```

4. **Start all services:**
   ```bash
   docker-compose up --build
   ```

5. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - Health check: http://localhost:5000/health

### Local Development Setup

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add OPENAI_API_KEY
npm run dev
```

#### Frontend Setup (new terminal)
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
.
├── docker-compose.yml              # Orchestrates all services
├── backend/
│   ├── Dockerfile                  # Node.js environment
│   ├── package.json                # Dependencies
│   ├── server.js                   # Express server setup
│   ├── .env.example                # Environment template
│   ├── controllers/
│   │   └── aiAgentController.js    # OpenAI integration & pricing
│   └── routes/
│       └── api.js                  # POST /api/quote endpoint
├── frontend/
│   ├── Dockerfile                  # Node.js/Vite environment
│   ├── package.json                # React dependencies
│   ├── index.html                  # HTML entry point
│   ├── vite.config.js              # Vite configuration
│   └── src/
│       ├── main.jsx                # React app entry
│       ├── App.jsx                 # Main UI component
│       ├── App.css                 # Styling
│       └── index.css               # Global styles
└── README.md
```

## 🎯 Key Features

### AI-Powered Quote Generation
- **Natural Language Processing**: Users describe their project in plain English
- **OpenAI Integration**: GPT-4 Turbo extracts structured specifications
- **Smart Parsing**: Intelligently infers dimensions and material properties

### Intelligent Pricing Formula
Includes:
- **Base Setup Cost**: $50 (fixed base)
- **Material Cost**: $0.15 per cm³ (plus 15% waste factor)
- **Labor Cost**: $5 per cm of height (complexity multiplier for hollowed designs)
- **Business Markup**: 25% markup on subtotal

### UI Features
- Clean, modern gradient interface
- Real-time processing with loading indicators
- Detailed pricing breakdown
- Responsive mobile design
- Material analysis and specifications display

## 🔌 API Documentation

### POST /api/quote

**Request:**
```json
{
  "prompt": "I need 3D printed letters for 'CAFE', 50cm height, 5cm depth, hollowed"
}
```

**Response:**
```json
{
  "success": true,
  "specifications": {
    "design_description": "Letters spelling CAFE",
    "width_cm": 50,
    "depth_cm": 5,
    "height_cm": 50,
    "material_type": "resin",
    "is_hollowed": true,
    "wall_thickness_cm": 0.3,
    "quantity": 1,
    "notes": ""
  },
  "pricing_per_unit": {
    "material_volume_cm3": 1242.75,
    "material_volume_with_waste_cm3": 1429.16,
    "material_cost_usd": 214.37,
    "labor_cost_usd": 325,
    "base_cost_usd": 50,
    "subtotal_usd": 589.37,
    "markup_percentage": 25,
    "total_usd": 736.71
  },
  "pricing_total": {
    "total_usd": 736.71,
    "quantity": 1
  }
}
```

## 🛠️ Configuration

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=development
PORT=5000
OPENAI_API_KEY=sk-your-key-here

# Database (optional for future expansion)
DB_HOST=postgres
DB_PORT=5432
DB_USER=signage_user
DB_PASSWORD=signage_password
DB_NAME=signage_db
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
```

## 📊 Pricing Formula Breakdown

For a 50cm × 5cm × 50cm hollowed design:
1. Gross volume: 12,500 cm³
2. Hollow subtraction: ~11,257.25 cm³
3. Net volume: 1,242.75 cm³
4. With waste (15%): 1,429.16 cm³
5. Material cost: 1,429.16 × $0.15 = $214.37
6. Labor cost: 50cm × $5 × 1.3 (hollow complexity) = $325
7. Subtotal: $50 + $214.37 + $325 = $589.37
8. Final: $589.37 × 1.25 (25% markup) = **$736.71**

## 🔐 Security Considerations

- OpenAI API keys stored in `.env` (never committed)
- CORS configured for specific origins
- Input validation on all endpoints
- Error handling without exposing sensitive information

## 🚢 Deployment

### Docker Compose
```bash
docker-compose up -d
```

### Production Checklist
- [ ] Set NODE_ENV=production
- [ ] Configure OPENAI_API_KEY securely (environment secret)
- [ ] Update CORS origins for production domain
- [ ] Use database for persistent storage (PostgreSQL ready)
- [ ] Set up error logging/monitoring
- [ ] Configure SSL/TLS certificates

## 📈 Future Enhancements

- [ ] User authentication & order history
- [ ] Payment integration (Stripe)
- [ ] Material library with pricing tiers
- [ ] 3D preview/visualization
- [ ] Multi-language support
- [ ] Admin dashboard for order management
- [ ] Email notifications
- [ ] File upload for custom designs

## 🐛 Troubleshooting

**"Cannot connect to backend"**
- Ensure backend is running on port 5000
- Check CORS configuration in `server.js`
- Verify firewall allows localhost connections

**"OPENAI_API_KEY not set"**
- Copy `.env.example` to `.env` in backend folder
- Add your actual API key from platform.openai.com
- Restart the backend service

**"Cannot parse AI response"**
- AI might return unexpected format
- Check OpenAI API status
- Verify prompt clarity in frontend

## 📝 License

MIT

## 👥 Support

For issues or questions, please create an issue in the repository.

---

**Built with:** React • Node.js • Express • PostgreSQL • Docker • OpenAI API
