const http = require('http');
http.request('http://localhost:3001/sales-imports/upload', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization, x-restaurant-id' } }, res => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
}).end();
