// Test script para verificar el endpoint de admin
const token = process.argv[2];

if (!token) {
  console.error("Usage: node test-admin-api.js YOUR_JWT_TOKEN");
  process.exit(1);
}

fetch("https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/admin/incidents", {
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }
})
.then(async response => {
  console.log("Status:", response.status);
  console.log("Headers:", Object.fromEntries(response.headers));
  const text = await response.text();
  console.log("Raw Response:", text);
  try {
    const json = JSON.parse(text);
    console.log("JSON Response:", JSON.stringify(json, null, 2));
    console.log("Incidents count:", json.incidents?.length || 0);
  } catch (e) {
    console.log("Not JSON response");
  }
})
.catch(err => {
  console.error("Error:", err);
});
