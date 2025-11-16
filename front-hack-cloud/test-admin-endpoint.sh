#!/bin/bash

# Script para probar el endpoint de admin/incidents
# Uso: ./test-admin-endpoint.sh YOUR_JWT_TOKEN

if [ -z "$1" ]; then
  echo "Uso: ./test-admin-endpoint.sh YOUR_JWT_TOKEN"
  exit 1
fi

TOKEN="$1"

echo "========================================="
echo "Testing /admin/incidents endpoint"
echo "========================================="
echo ""

echo "Request:"
echo "  URL: https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/admin/incidents"
echo "  Method: GET"
echo "  Headers: Authorization: Bearer ${TOKEN:0:20}..."
echo ""

echo "Response:"
curl -v -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/admin/incidents \
  2>&1 | grep -v "^* " | grep -v "^> " | grep -v "^< "

echo ""
echo ""
echo "========================================="
echo "Testing /incidents endpoint (for comparison)"
echo "========================================="
echo ""

curl -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com/incidents \
  2>&1 | grep -v "^* " | grep -v "^> " | grep -v "^< "

echo ""
