#!/bin/bash

API_BASE_URL="http://localhost:3000/api/v1"

echo "🔐 Logging in..."
TOKEN=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin@manufacturing.com","password":"admin123"}' | \
  grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  exit 1
fi

echo "✅ Got authentication token"

# Get manufacturing orders
echo "📋 Fetching manufacturing orders..."
MO_RESPONSE=$(curl -s -X GET "$API_BASE_URL/manufacturing-orders" \
  -H "Authorization: Bearer $TOKEN")

# Extract first MO ID (simplified approach)
MO_ID=$(echo "$MO_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$MO_ID" ]; then
  echo "❌ No manufacturing orders found"
  exit 1
fi

echo "✅ Found manufacturing order: $MO_ID"

# Get work centers
echo "🏭 Fetching work centers..."
WC_RESPONSE=$(curl -s -X GET "$API_BASE_URL/work-centers" \
  -H "Authorization: Bearer $TOKEN")

# Extract first work center ID
WC_ID=$(echo "$WC_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$WC_ID" ]; then
  echo "❌ No work centers found"
  exit 1
fi

echo "✅ Found work center: $WC_ID"

# Create work orders
operations=("Setup Machine" "Material Preparation" "Cutting" "Assembly" "Quality Check")
statuses=("pending" "in-progress" "paused" "completed")
priorities=("low" "medium" "high" "urgent")

echo "📝 Creating work orders..."

for i in {1..5}; do
  operation=${operations[$((i-1))]}
  status=${statuses[$((RANDOM % 4))]}
  priority=${priorities[$((RANDOM % 4))]}
  duration=$((RANDOM % 200 + 30))
  
  echo "Creating work order $i: $operation..."
  
  RESPONSE=$(curl -s -X POST "$API_BASE_URL/work-orders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"manufacturing_order_id\": \"$MO_ID\",
      \"work_center_id\": \"$WC_ID\",
      \"operation\": \"$operation\",
      \"operation_type\": \"machining\",
      \"duration\": $duration,
      \"estimated_duration\": $duration,
      \"status\": \"$status\",
      \"priority\": \"$priority\",
      \"sequence\": $i,
      \"instructions\": \"Detailed instructions for $operation operation. Follow safety protocols and quality standards.\",
      \"dependencies\": [],
      \"quality_checks\": [],
      \"time_entries\": [],
      \"metadata\": {}
    }")
  
  if echo "$RESPONSE" | grep -q '"success":true'; then
    WO_NUMBER=$(echo "$RESPONSE" | grep -o '"wo_number":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Created work order: $WO_NUMBER"
  else
    echo "❌ Failed to create work order: $operation"
    echo "Response: $RESPONSE"
  fi
done

echo ""
echo "🔍 Verifying work orders..."
VERIFY_RESPONSE=$(curl -s -X GET "$API_BASE_URL/work-orders" \
  -H "Authorization: Bearer $TOKEN")

WO_COUNT=$(echo "$VERIFY_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
echo "✅ Found $WO_COUNT work orders in the database"

echo ""
echo "🎉 Work orders creation completed!"
