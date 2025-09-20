const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
const testPhone = '+1-555-0100';
console.log('Phone regex test:', phoneRegex.test(testPhone));
console.log('Phone value:', testPhone);

// Test the old regex too
const oldPhoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
console.log('Old regex test:', oldPhoneRegex.test(testPhone));