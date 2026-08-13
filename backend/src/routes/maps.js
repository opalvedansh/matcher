const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const CircuitBreaker = require('opossum');

const breakerOptions = {
  timeout: 5000, // 5 seconds
  errorThresholdPercentage: 50,
  resetTimeout: 10000, // 10 seconds before trying again
  capacity: 50 // Max 50 concurrent requests
};

const fetchBreaker = new CircuitBreaker(async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}, breakerOptions);

fetchBreaker.on('open', () => console.warn(`[CircuitBreaker] Maps API circuit OPEN`));
fetchBreaker.on('halfOpen', () => console.warn(`[CircuitBreaker] Maps API circuit HALF-OPEN`));
fetchBreaker.on('close', () => console.warn(`[CircuitBreaker] Maps API circuit CLOSED`));


router.get('/autocomplete', authenticate, async (req, res, next) => {
  try {
    const { input, types, key } = req.query;
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || key;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;
    if (types) {
      url += `&types=${types}`;
    }
    
    const data = await fetchBreaker.fire(url);
    res.json(data);
  } catch (error) {
    if (error.code === 'EOPENBREAKER' || error.code === 'ETIMEDOUT') {
      console.warn(`[Maps] Autocomplete failed due to breaker:`, error.message);
      return res.json({ predictions: [], _circuit_breaker: true });
    }
    next(error);
  }
});

router.get('/geocode', authenticate, async (req, res, next) => {
  try {
    const { place_id, key } = req.query;
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || key;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${place_id}&key=${apiKey}`;
    
    const data = await fetchBreaker.fire(url);
    res.json(data);
  } catch (error) {
    if (error.code === 'EOPENBREAKER' || error.code === 'ETIMEDOUT') {
      console.warn(`[Maps] Geocode failed due to breaker:`, error.message);
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }
    next(error);
  }
});

module.exports = router;
