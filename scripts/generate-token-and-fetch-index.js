const axios = require('axios');
const cron = require('node-cron');
const { exec } = require('child_process'); // To execute shell commands
require('dotenv').config();  // Load environment variables from .env

// Determine if we are in local (development) or production
const isLocal = process.env.NODE_ENV === 'development';
console.log(isLocal);

// Define the base URL for API calls (adjust for local vs. production)
const BASE_URL = isLocal ? 'http://localhost:3001/api' : 'https://research.qodeinvest.com/api';

// Function to generate the access token
async function generateToken() {
  try {
    const response = await axios.get(`${BASE_URL}/generate-token`);

    // Log the entire response for debugging purposes
    console.log('Raw response from API:', response.data);

    // Check if the response contains the expected token
    if (response.data && response.data.token) {
      console.log('Token generated:', response.data.message);
      console.log('Generated token:', response.data.token);
      return true; // Indicate success
    } else {
      console.error('Token generation failed: No token found in response.');
      console.error('Response data:', response.data);
      return false; // Indicate failure
    }
  } catch (error) {
    // Log errors with additional details
    if (error.response) {
      console.error('Error response from API:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received from API:', error.request);
    } else {
      console.error('Error during request setup:', error.message);
    }
    return false; // Indicate failure
  }
}



// Function to run the `npm run build` command
async function runBuild() {
  return new Promise((resolve, reject) => {
    console.log('Starting npm run build...');
    exec('npm run build', (error, stdout, stderr) => {
      if (error) {
        console.error('Error during build:', error.message);
        reject(error);
      } else {
        console.log('Build output:', stdout);
        if (stderr) console.error('Build warnings/errors:', stderr);
        resolve(true); // Indicate success
      }
    });
  });
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
cron.schedule('* * * * *', async () => {
  console.log('Running scheduled task...');

  const tokenGenerated = await generateToken(); // Generate token

  if (tokenGenerated) {
    try {
      await runBuild(); // Run npm run build
      await fetchIndexData(); // Fetch index data
    } catch (error) {
      console.error('Error in task sequence:', error);
    }
  } else {
    console.error('Skipping subsequent steps due to token generation failure.');
  }
});

console.log('Cron job scheduled to run every day at midnight...');
