// backend/generate-secret.js

const crypto = require('crypto');

// Generate a random string of 64 characters
const secret = crypto.randomBytes(32).toString('hex');
console.log('Your JWT Secret:');
console.log(secret);