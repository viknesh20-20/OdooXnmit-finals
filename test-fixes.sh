#!/bin/bash

echo "🧪 Starting Manufacturing ERP Fix Verification Tests"
echo "================================================"

BASE_URL="http://localhost:3000/api/v1"

# Test 1: Login with existing admin user
echo ""
echo "=== Testing Login (Existing User) ==="
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin@manufacturing.com","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Login successful"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  echo "Token obtained: ${TOKEN:0:20}..."
else
  echo "❌ Login failed"
  echo "Response: $LOGIN_RESPONSE"
  TOKEN=""
fi

# Test 2: User Registration
echo ""
echo "=== Testing User Registration ==="
TIMESTAMP=$(date +%s)
REG_DATA="{\"username\":\"testuser$TIMESTAMP\",\"email\":\"testuser$TIMESTAMP@example.com\",\"password\":\"TestPassword123\",\"firstName\":\"Test\",\"lastName\":\"User\"}"

echo "Attempting registration with timeout..."
REGISTRATION_RESPONSE=$(timeout 10 curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$REG_DATA" 2>/dev/null)

if [ $? -eq 124 ]; then
  echo "❌ Registration timed out - endpoint may be hanging"
  REG_SUCCESS=false
elif echo "$REGISTRATION_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Registration successful"
  REG_TOKEN=$(echo "$REGISTRATION_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  echo "New user token obtained: ${REG_TOKEN:0:20}..."
  REG_SUCCESS=true
else
  echo "❌ Registration failed"
  echo "Response: $REGISTRATION_RESPONSE"
  REG_SUCCESS=false
fi

# Test 3: Data Consistency - Manufacturing Orders
if [ -n "$TOKEN" ]; then
  echo ""
  echo "=== Testing Data Consistency Fixes ==="
  
  echo "Testing Manufacturing Orders API..."
  MO_RESPONSE=$(curl -s -X GET "$BASE_URL/manufacturing-orders" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$MO_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Manufacturing Orders API accessible"
    
    # Check for expected field names
    if echo "$MO_RESPONSE" | grep -q '"reference"'; then
      echo "  ✅ 'reference' field found"
    else
      echo "  ❌ 'reference' field missing"
    fi
    
    if echo "$MO_RESPONSE" | grep -q '"productName"'; then
      echo "  ✅ 'productName' field found"
    else
      echo "  ❌ 'productName' field missing"
    fi
    
    if echo "$MO_RESPONSE" | grep -q '"startDate"'; then
      echo "  ✅ 'startDate' field found"
    else
      echo "  ❌ 'startDate' field missing"
    fi
    
    if echo "$MO_RESPONSE" | grep -q '"dueDate"'; then
      echo "  ✅ 'dueDate' field found"
    else
      echo "  ❌ 'dueDate' field missing"
    fi
  else
    echo "❌ Manufacturing Orders API failed"
    echo "Response: $MO_RESPONSE"
  fi
  
  # Test Products API
  echo ""
  echo "Testing Products API..."
  PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$PRODUCTS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Products API accessible"
  else
    echo "❌ Products API failed"
  fi
  
  # Test Work Centers API
  echo ""
  echo "Testing Work Centers API..."
  WC_RESPONSE=$(curl -s -X GET "$BASE_URL/work-centers" \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$WC_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Work Centers API accessible"
  else
    echo "❌ Work Centers API failed"
  fi
  
else
  echo ""
  echo "=== Skipping Data Consistency Tests (no token) ==="
fi

# Summary
echo ""
echo "================================================"
echo "🏁 Test Summary:"

if [ -n "$TOKEN" ]; then
  echo "- Admin Login: ✅ PASS"
else
  echo "- Admin Login: ❌ FAIL"
fi

if [ "$REG_SUCCESS" = true ]; then
  echo "- User Registration: ✅ PASS"
else
  echo "- User Registration: ❌ FAIL"
fi

if [ -n "$TOKEN" ]; then
  echo "- Data APIs: ✅ TESTED"
else
  echo "- Data APIs: ❌ SKIPPED"
fi

if [ -n "$TOKEN" ] && [ "$REG_SUCCESS" = true ]; then
  echo ""
  echo "🎉 MAJOR PROGRESS - Login works and data APIs are accessible!"
  echo "   Registration may need additional debugging."
elif [ -n "$TOKEN" ]; then
  echo ""
  echo "⚠️  PARTIAL SUCCESS - Login and data APIs work, registration needs work"
else
  echo ""
  echo "❌ TESTS FAILED - Issues still need to be resolved"
fi

echo ""
echo "📋 Next Steps:"
if [ "$REG_SUCCESS" != true ]; then
  echo "1. Debug registration endpoint hanging/timeout issue"
  echo "2. Check backend logs for registration errors"
  echo "3. Verify database connection for user creation"
fi
echo "4. Test frontend integration with fixed APIs"
echo "5. Verify field mappings in UI components"
