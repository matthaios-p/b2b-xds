# Development Guide

## Local Development Workflow

### Terminal 1: Backend
```bash
cd backend
npm install
npm run dev
```
The backend will start on `http://localhost:5000`

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`

## Testing the API

### Using cURL
```bash
curl -X POST http://localhost:5000/api/quote \
  -H "Content-Type: application/json" \
  -d '{"prompt": "I need 3D printed letters for HELLO, 40cm tall, 4cm thick, solid"}'
```

### Using API Client (Postman/Insomnia)
1. Method: `POST`
2. URL: `http://localhost:5000/api/quote`
3. Headers: `Content-Type: application/json`
4. Body:
   ```json
   {
     "prompt": "I need 3D printed signage for my cafe, 60cm height, 8cm depth with text 'COFFEE', hollowed inside"
   }
   ```

## Code Structure

### Backend

**server.js**
- Express app initialization
- CORS middleware setup
- Routes registration
- Error handling

**controllers/aiAgentController.js**
- `processQuoteRequest(prompt)` - Main handler
- `calculatePricing(specs)` - Pricing formula implementation
- OpenAI API integration

**routes/api.js**
- `POST /api/quote` endpoint
- Request validation
- Response formatting

### Frontend

**App.jsx**
- Main React component
- State management (prompt, result, loading, error)
- API calls via axios
- UI rendering

**App.css**
- Responsive grid layout
- Gradient styling
- Mobile-first design
- Animation (spinner)

## Extending the Application

### Add New Endpoints
1. Create new controller in `backend/controllers/`
2. Define routes in `backend/routes/api.js`
3. Update frontend API calls in `frontend/src/App.jsx`

### Modify Pricing
Edit `PRICING_CONSTANTS` in `backend/controllers/aiAgentController.js`

### Change AI Behavior
Modify `systemPrompt` in `processQuoteRequest()` function

### Update Frontend Styling
Edit `frontend/src/App.css` or component-specific CSS

## Docker Development

### Rebuild after changes
```bash
docker-compose up --build
```

### View logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop services
```bash
docker-compose down
```

### Remove volumes (reset database)
```bash
docker-compose down -v
```

## Performance Tips

- Vite hot module reloading works on code changes
- Nodemon restarts backend on file changes
- Use browser DevTools for frontend debugging
- Check backend logs for API errors

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Port already in use | Change PORT in .env or kill process using port |
| Module not found | Run `npm install` in respective folder |
| CORS error | Verify origin in server.js CORS config |
| Slow AI response | Check internet connection, OpenAI API status |
| Frontend can't reach backend | Verify VITE_API_URL matches backend URL |
