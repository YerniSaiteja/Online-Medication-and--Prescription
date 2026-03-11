// API Configuration
// This file determines the API base URL based on the environment

// Determine if we're in development (localhost) or production
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Set the API base URL
// For production, replace this with your actual backend URL
// Examples:
// - If using Heroku: 'https://your-app-name.herokuapp.com'
// - If using Railway: 'https://your-app-name.railway.app'
// - If using Render: 'https://your-app-name.onrender.com'
// - If using a custom domain: 'https://api.yourdomain.com'
const API_BASE_URL = isDevelopment 
    ? 'http://localhost:5000' 
    : (window.API_BASE_URL || 'https://your-backend-url.herokuapp.com'); // Replace with your actual backend URL

// Export the configuration
window.API_CONFIG = {
    BASE_URL: API_BASE_URL,
    API_URL: `${API_BASE_URL}/api`
};

// Helper function to get the full API URL for an endpoint
window.getApiUrl = function(endpoint) {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_BASE_URL}/api/${cleanEndpoint}`;
};

console.log('API Configuration loaded:', {
    environment: isDevelopment ? 'development' : 'production',
    baseUrl: API_BASE_URL
});

