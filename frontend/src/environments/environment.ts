export const environment = {
  production: false,
  // Backend API Base URL:
  // Option A (Default with dev proxy): '/api/v1' (proxies to backend https://localhost:7000 or http://localhost:5000)
  // Option B (Direct HTTPS call without proxy): 'https://localhost:7000/api/v1'
  apiBaseUrl: "/api/v1",
  backendUrl: "http://localhost:5000",
};
