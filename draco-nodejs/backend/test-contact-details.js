const axios = require('axios');

// Test the new contact details functionality
async function testContactDetails() {
  try {
    console.log('Testing contact details functionality...\n');

    // Test 1: Get contacts without contact details (existing behavior)
    console.log('Test 1: Get contacts without contact details');
    const response1 = await axios.get('http://localhost:3001/api/accounts/1/contacts?page=1&limit=5');
    console.log('Response status:', response1.status);
    console.log('Contacts returned:', response1.data.data.contacts.length);
    console.log('First contact structure:', Object.keys(response1.data.data.contacts[0]));
    console.log('');

    // Test 2: Get contacts with contact details
    console.log('Test 2: Get contacts with contact details');
    const response2 = await axios.get('http://localhost:3001/api/accounts/1/contacts?page=1&limit=5&contactDetails=true');
    console.log('Response status:', response2.status);
    console.log('Contacts returned:', response2.data.data.contacts.length);
    console.log('First contact structure:', Object.keys(response2.data.data.contacts[0]));
    
    if (response2.data.data.contacts[0].contactDetails) {
      console.log('Contact details structure:', Object.keys(response2.data.data.contacts[0].contactDetails));
      console.log('Sample contact details:', response2.data.data.contacts[0].contactDetails);
    } else {
      console.log('No contact details found in response');
    }
    console.log('');

    // Test 3: Get contacts with roles and contact details
    console.log('Test 3: Get contacts with roles and contact details');
    const response3 = await axios.get('http://localhost:3001/api/accounts/1/contacts?page=1&limit=5&roles=true&contactDetails=true');
    console.log('Response status:', response3.status);
    console.log('Contacts returned:', response3.data.data.contacts.length);
    console.log('First contact structure:', Object.keys(response3.data.data.contacts[0]));
    
    if (response3.data.data.contacts[0].contactDetails) {
      console.log('Contact details structure:', Object.keys(response3.data.data.contacts[0].contactDetails));
    }
    if (response3.data.data.contacts[0].contactroles) {
      console.log('Roles found:', response3.data.data.contacts[0].contactroles.length);
    }
    console.log('');

    console.log('All tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testContactDetails(); 