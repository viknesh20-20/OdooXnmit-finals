const bcrypt = require('bcrypt');

const password = 'admin123';
const hash = '$2b$12$yZhNie5YUVJyOMZ0oEt08OksXa18zOZXHiv3EpGRrzIoBZawBPAee';

bcrypt.compare(password, hash).then(result => {
  console.log('Password "admin123" matches hash:', result);
}).catch(console.error);

// Try other common passwords
const passwords = ['admin', 'password', 'password123', '123456', 'admin1234'];
Promise.all(passwords.map(pwd => 
  bcrypt.compare(pwd, hash).then(result => ({ password: pwd, matches: result }))
)).then(results => {
  console.log('Password tests:', results);
}).catch(console.error);