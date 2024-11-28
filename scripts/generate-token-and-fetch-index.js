const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();  // Load environment variables from .env

// Determine if we are in local (development) or production
const isLocal = process.env.NODE_ENV === 'development';

// Define the base URL for API calls (adjust for local vs. production)
const BASE_URL = isLocal ? 'http://localhost:3000/api' : 'https://research.qodeinvest.com/api';

// Function to generate the access token
async function generateToken() {
  try {
    const response = await axios.get(`${BASE_URL}/generate-token`);
    console.log('Token generated:', response.data.message);
  } catch (error) {
    console.error('Error generating token:', error);
  }
}

// Function to fetch the index data
async function fetchIndexData() {
  try {
    const response = await axios.get(`${BASE_URL}/fetchIndex`);
    console.log('Fetched index data:', response.data);
  } catch (error) {
    console.error('Error fetching index data:', error);
  }
}

// Schedule the task to run every 24 hours (midnight)
cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled task...');
  await generateToken();   // Generate token
  await fetchIndexData();  // Fetch index data
});

console.log('Cron job scheduled to run every day at midnight...');
