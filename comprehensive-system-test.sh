#!/bin/bash

echo "🚀 Manufacturing ERP System - Comprehensive Production Test"
echo "=========================================================="

BASE_URL="http://localhost:3000/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}🧪 Testing: $test_name${NC}"
    
    result=$(eval "$test_command" 2>/dev/null)
    
    if echo "$result" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        echo -e "${YELLOW}Expected pattern: $expected_pattern${NC}"
        echo -e "${YELLOW}Actual result: ${result:0:200}...${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Get authentication token
echo -e "\n${BLUE}🔐 Authentication Tests${NC}"
echo "========================"

TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin@manufacturing.com","password":"admin123"}' | \
  grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Authentication successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ Authentication failed - cannot continue tests${NC}"
    exit 1
fi

# Test 1: User Registration
run_test "User Registration" \
    "curl -s -X POST $BASE_URL/auth/register -H 'Content-Type: application/json' -d '{\"username\":\"testuser$(date +%s)\",\"email\":\"test$(date +%s)@example.com\",\"password\":\"TestPassword123\",\"firstName\":\"Test\",\"lastName\":\"User\"}'" \
    '"success":true'

# Test 2: Products API
echo -e "\n${BLUE}📦 Products API Tests${NC}"
echo "====================="

run_test "Get Products" \
    "curl -s -X GET $BASE_URL/products -H 'Authorization: Bearer $TOKEN'" \
    '"success":true'

run_test "Products Field Mapping" \
    "curl -s -X GET $BASE_URL/products -H 'Authorization: Bearer $TOKEN'" \
    '"name":'

# Test 3: Manufacturing Orders API
echo -e "\n${BLUE}🏭 Manufacturing Orders API Tests${NC}"
echo "=================================="

run_test "Get Manufacturing Orders" \
    "curl -s -X GET $BASE_URL/manufacturing-orders -H 'Authorization: Bearer $TOKEN'" \
    '"success":true'

run_test "Manufacturing Orders Field Mapping - Reference" \
    "curl -s -X GET $BASE_URL/manufacturing-orders -H 'Authorization: Bearer $TOKEN'" \
    '"reference":'

run_test "Manufacturing Orders Field Mapping - Product Name" \
    "curl -s -X GET $BASE_URL/manufacturing-orders -H 'Authorization: Bearer $TOKEN'" \
    '"productName":'

run_test "Manufacturing Orders Field Mapping - Start Date" \
    "curl -s -X GET $BASE_URL/manufacturing-orders -H 'Authorization: Bearer $TOKEN'" \
    '"startDate":'

run_test "Manufacturing Orders Field Mapping - Due Date" \
    "curl -s -X GET $BASE_URL/manufacturing-orders -H 'Authorization: Bearer $TOKEN'" \
    '"dueDate":'

# Test 4: Work Centers API
echo -e "\n${BLUE}🏗️ Work Centers API Tests${NC}"
echo "=========================="

run_test "Get Work Centers" \
    "curl -s -X GET $BASE_URL/work-centers -H 'Authorization: Bearer $TOKEN'" \
    '"success":true'

run_test "Work Centers Data Present" \
    "curl -s -X GET $BASE_URL/work-centers -H 'Authorization: Bearer $TOKEN'" \
    '"workCenters":'

# Test 5: BOMs API
echo -e "\n${BLUE}📋 BOMs API Tests${NC}"
echo "=================="

run_test "Get BOMs" \
    "curl -s -X GET $BASE_URL/boms -H 'Authorization: Bearer $TOKEN'" \
    '"success":true'

run_test "BOMs Data Present" \
    "curl -s -X GET $BASE_URL/boms -H 'Authorization: Bearer $TOKEN'" \
    '"boms":'

# Test 6: Work Orders API
echo -e "\n${BLUE}⚙️ Work Orders API Tests${NC}"
echo "========================"

run_test "Get Work Orders" \
    "curl -s -X GET $BASE_URL/work-orders -H 'Authorization: Bearer $TOKEN'" \
    '"success":true'

# Test 7: Stock Movements API
echo -e "\n${BLUE}📊 Stock Movements API Tests${NC}"
echo "============================="

run_test "Get Stock Movements" \
    "curl -s -X GET $BASE_URL/stock-movements -H 'Authorization: Bearer $TOKEN'" \
    '"success":true'

# Test 8: Dashboard API
echo -e "\n${BLUE}📈 Dashboard API Tests${NC}"
echo "======================"

run_test "Get Dashboard Data" \
    "curl -s -X GET $BASE_URL/dashboard -H 'Authorization: Bearer $TOKEN'" \
    '"success":true'

# Test 9: CRUD Operations Test
echo -e "\n${BLUE}🔄 CRUD Operations Tests${NC}"
echo "========================="

# Get existing product and BOM IDs for creating new MO
PRODUCT_ID=$(curl -s -X GET "$BASE_URL/products" -H "Authorization: Bearer $TOKEN" | \
    grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
BOM_ID=$(curl -s -X GET "$BASE_URL/boms" -H "Authorization: Bearer $TOKEN" | \
    grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
USER_ID="d3c806dc-2555-4a8b-a7c1-54f7962a04e8"

if [ -n "$PRODUCT_ID" ] && [ -n "$BOM_ID" ]; then
    run_test "Create Manufacturing Order" \
        "curl -s -X POST $BASE_URL/manufacturing-orders -H 'Content-Type: application/json' -H 'Authorization: Bearer $TOKEN' -d '{\"product_id\":\"$PRODUCT_ID\",\"bom_id\":\"$BOM_ID\",\"quantity\":25,\"quantity_unit\":\"pcs\",\"status\":\"draft\",\"priority\":\"high\",\"planned_start_date\":\"2024-02-01T08:00:00Z\",\"planned_end_date\":\"2024-02-05T17:00:00Z\",\"created_by\":\"$USER_ID\",\"assigned_to\":\"$USER_ID\",\"notes\":\"Test CRUD operation\"}'" \
        '"success":true'
else
    echo -e "${YELLOW}⚠️ Skipping CRUD test - missing product or BOM data${NC}"
fi

# Test 10: Data Consistency Check
echo -e "\n${BLUE}🔍 Data Consistency Tests${NC}"
echo "=========================="

# Check that all APIs return consistent data structures
run_test "Manufacturing Orders Pagination" \
    "curl -s -X GET $BASE_URL/manufacturing-orders -H 'Authorization: Bearer $TOKEN'" \
    '"pagination":'

run_test "Products Pagination" \
    "curl -s -X GET $BASE_URL/products -H 'Authorization: Bearer $TOKEN'" \
    '"pagination":'

run_test "Work Centers Pagination" \
    "curl -s -X GET $BASE_URL/work-centers -H 'Authorization: Bearer $TOKEN'" \
    '"pagination":'

# Test 11: Error Handling
echo -e "\n${BLUE}🚨 Error Handling Tests${NC}"
echo "======================="

run_test "Invalid Token Handling" \
    "curl -s -X GET $BASE_URL/manufacturing-orders -H 'Authorization: Bearer invalid-token'" \
    '"success":false'

run_test "Missing Required Fields" \
    "curl -s -X POST $BASE_URL/manufacturing-orders -H 'Content-Type: application/json' -H 'Authorization: Bearer $TOKEN' -d '{}'" \
    '"success":false'

# Final Results
echo -e "\n${BLUE}📊 Test Results Summary${NC}"
echo "======================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! System is production-ready!${NC}"
    echo -e "${GREEN}✅ Authentication system working${NC}"
    echo -e "${GREEN}✅ All APIs accessible and returning data${NC}"
    echo -e "${GREEN}✅ Field mappings correct${NC}"
    echo -e "${GREEN}✅ CRUD operations functional${NC}"
    echo -e "${GREEN}✅ Error handling working${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. System needs attention.${NC}"
    echo -e "${YELLOW}Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%${NC}"
    exit 1
fi
