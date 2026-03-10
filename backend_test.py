#!/usr/bin/env python3
"""
Backend API Test Suite for Easy Load & Dump - Dump Trailer Rental Business
Tests all API endpoints comprehensively with realistic data
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Base configuration
BASE_URL = "https://easy-book-haul.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test data - realistic dump trailer rental data
TEST_CUSTOMER = {
    "customerName": "Sarah Johnson",
    "phone": "(509) 555-0123",
    "email": "sarah.johnson@email.com",
    "address": "1234 Maple Street, Spokane, WA 99201"
}

# Admin credentials
ADMIN_CREDS = {
    "username": "admin", 
    "password": "admin123"
}

# Global variables for test data
admin_token = None
booking_id = None
customer_id = None

def log_test(test_name, status, details=""):
    """Log test results"""
    status_icon = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"{status_icon} {test_name}: {status}")
    if details:
        print(f"   {details}")

def test_pricing_get():
    """Test GET /api/pricing endpoint"""
    try:
        response = requests.get(f"{API_BASE}/pricing", timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/pricing", "FAIL", f"Status: {response.status_code}")
            return False
            
        data = response.json()
        required_fields = ['baseRentalFee', 'deliveryFee', 'dumpFee', 'extraHourFee']
        
        if not all(field in data for field in required_fields):
            log_test("GET /api/pricing", "FAIL", f"Missing required fields")
            return False
            
        log_test("GET /api/pricing", "PASS", f"Base rental: ${data['baseRentalFee']}")
        return True
        
    except Exception as e:
        log_test("GET /api/pricing", "FAIL", f"Exception: {str(e)}")
        return False

def test_admin_login():
    """Test POST /api/auth/login"""
    global admin_token
    try:
        response = requests.post(
            f"{API_BASE}/auth/login", 
            json=ADMIN_CREDS,
            timeout=10
        )
        
        if response.status_code != 200:
            log_test("POST /api/auth/login", "FAIL", f"Status: {response.status_code}")
            return False
            
        data = response.json()
        
        if 'token' not in data or 'admin' not in data:
            log_test("POST /api/auth/login", "FAIL", "Missing token or admin data")
            return False
            
        admin_token = data['token']
        log_test("POST /api/auth/login", "PASS", f"Admin: {data['admin']['username']}")
        return True
        
    except Exception as e:
        log_test("POST /api/auth/login", "FAIL", f"Exception: {str(e)}")
        return False

def test_auth_verify():
    """Test GET /api/auth/verify"""
    if not admin_token:
        log_test("GET /api/auth/verify", "SKIP", "No admin token available")
        return False
        
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{API_BASE}/auth/verify", headers=headers, timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/auth/verify", "FAIL", f"Status: {response.status_code}")
            return False
            
        data = response.json()
        if 'admin' not in data:
            log_test("GET /api/auth/verify", "FAIL", "Missing admin data")
            return False
            
        log_test("GET /api/auth/verify", "PASS", f"Verified admin: {data['admin']['username']}")
        return True
        
    except Exception as e:
        log_test("GET /api/auth/verify", "FAIL", f"Exception: {str(e)}")
        return False

def test_create_booking():
    """Test POST /api/bookings"""
    global booking_id, customer_id
    
    # Calculate preferred date (tomorrow)
    preferred_date = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    booking_data = {
        **TEST_CUSTOMER,
        "preferredDate": preferred_date,
        "preferredTime": "10:00 AM",
        "rentalDuration": "4",  # 4 hours
        "loadType": "household_items",
        "description": "Moving cleanout - furniture and household items",
        "requestType": "booking",
        "agreedToTerms": True
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/bookings", 
            json=booking_data,
            timeout=10
        )
        
        if response.status_code != 201:
            log_test("POST /api/bookings", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
        data = response.json()
        
        required_fields = ['id', 'customerId', 'status', 'estimatedPrice']
        if not all(field in data for field in required_fields):
            log_test("POST /api/bookings", "FAIL", "Missing required response fields")
            return False
            
        booking_id = data['id']
        customer_id = data['customerId']
        
        log_test("POST /api/bookings", "PASS", f"Booking created: {booking_id}, Price: ${data['estimatedPrice']}")
        return True
        
    except Exception as e:
        log_test("POST /api/bookings", "FAIL", f"Exception: {str(e)}")
        return False

def test_get_bookings():
    """Test GET /api/bookings"""
    try:
        response = requests.get(f"{API_BASE}/bookings", timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/bookings", "FAIL", f"Status: {response.status_code}")
            return False
            
        data = response.json()
        
        if not isinstance(data, list):
            log_test("GET /api/bookings", "FAIL", "Response is not a list")
            return False
            
        # Test with status filter
        response_filtered = requests.get(f"{API_BASE}/bookings?status=pending", timeout=10)
        if response_filtered.status_code == 200:
            filtered_data = response_filtered.json()
            pending_count = len([b for b in filtered_data if b.get('status') == 'pending'])
            log_test("GET /api/bookings", "PASS", f"Total: {len(data)}, Pending: {pending_count}")
        else:
            log_test("GET /api/bookings", "PASS", f"Total bookings: {len(data)}")
            
        return True
        
    except Exception as e:
        log_test("GET /api/bookings", "FAIL", f"Exception: {str(e)}")
        return False

def test_get_single_booking():
    """Test GET /api/bookings/[id]"""
    if not booking_id:
        log_test("GET /api/bookings/[id]", "SKIP", "No booking ID available")
        return False
        
    try:
        response = requests.get(f"{API_BASE}/bookings/{booking_id}", timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/bookings/[id]", "FAIL", f"Status: {response.status_code}")
            return False
            
        data = response.json()
        
        if data.get('id') != booking_id:
            log_test("GET /api/bookings/[id]", "FAIL", "Booking ID mismatch")
            return False
            
        log_test("GET /api/bookings/[id]", "PASS", f"Booking: {data.get('customerName')}, Status: {data.get('status')}")
        return True
        
    except Exception as e:
        log_test("GET /api/bookings/[id]", "FAIL", f"Exception: {str(e)}")
        return False

def test_update_booking():
    """Test PUT /api/bookings/[id]"""
    if not booking_id:
        log_test("PUT /api/bookings/[id]", "SKIP", "No booking ID available")
        return False
        
    try:
        # Update booking status and add charges
        update_data = {
            "status": "confirmed",
            "paymentStatus": "deposit_paid",
            "depositAmount": 75,
            "extraCharges": [
                {"description": "Heavy item surcharge", "amount": 25}
            ],
            "internalNotes": "Customer confirmed for tomorrow morning"
        }
        
        response = requests.put(
            f"{API_BASE}/bookings/{booking_id}", 
            json=update_data,
            timeout=10
        )
        
        if response.status_code != 200:
            log_test("PUT /api/bookings/[id]", "FAIL", f"Status: {response.status_code}")
            return False
            
        data = response.json()
        
        if data.get('status') != 'confirmed':
            log_test("PUT /api/bookings/[id]", "FAIL", "Status not updated")
            return False
            
        log_test("PUT /api/bookings/[id]", "PASS", f"Updated to: {data.get('status')}, Deposit: ${data.get('depositAmount')}")
        return True
        
    except Exception as e:
        log_test("PUT /api/bookings/[id]", "FAIL", f"Exception: {str(e)}")
        return False

def test_get_customers():
    """Test GET /api/customers"""
    try:
        response = requests.get(f"{API_BASE}/customers", timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/customers", "FAIL", f"Status: {response.status_code}")
            return False
            
        data = response.json()
        
        if not isinstance(data, list):
            log_test("GET /api/customers", "FAIL", "Response is not a list")
            return False
            
        log_test("GET /api/customers", "PASS", f"Total customers: {len(data)}")
        return True
        
    except Exception as e:
        log_test("GET /api/customers", "FAIL", f"Exception: {str(e)}")
        return False

def test_get_single_customer():
    """Test GET /api/customers/[id]"""
    if not customer_id:
        log_test("GET /api/customers/[id]", "SKIP", "No customer ID available")
        return False
        
    try:
        response = requests.get(f"{API_BASE}/customers/{customer_id}", timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/customers/[id]", "FAIL", f"Status: {response.status_code}")
            return False
            
        data = response.json()
        
        if data.get('id') != customer_id or 'bookings' not in data:
            log_test("GET /api/customers/[id]", "FAIL", "Missing customer data or bookings")
            return False
            
        log_test("GET /api/customers/[id]", "PASS", f"Customer: {data.get('name')}, Bookings: {len(data.get('bookings', []))}")
        return True
        
    except Exception as e:
        log_test("GET /api/customers/[id]", "FAIL", f"Exception: {str(e)}")
        return False

def test_update_pricing():
    """Test PUT /api/pricing"""
    try:
        # Get current pricing first
        get_response = requests.get(f"{API_BASE}/pricing", timeout=10)
        if get_response.status_code != 200:
            log_test("PUT /api/pricing", "FAIL", "Cannot get current pricing")
            return False
            
        current_pricing = get_response.json()
        
        # Update with slightly modified pricing
        updated_pricing = {
            **current_pricing,
            "baseRentalFee": current_pricing.get("baseRentalFee", 150) + 5,  # Increase by $5
            "serviceCityState": "Spokane, WA - Updated"
        }
        
        response = requests.put(
            f"{API_BASE}/pricing", 
            json=updated_pricing,
            timeout=10
        )
        
        if response.status_code != 200:
            log_test("PUT /api/pricing", "FAIL", f"Status: {response.status_code}")
            return False
            
        data = response.json()
        
        if data.get('baseRentalFee') != updated_pricing['baseRentalFee']:
            log_test("PUT /api/pricing", "FAIL", "Pricing not updated")
            return False
            
        log_test("PUT /api/pricing", "PASS", f"Base rental updated to: ${data.get('baseRentalFee')}")
        return True
        
    except Exception as e:
        log_test("PUT /api/pricing", "FAIL", f"Exception: {str(e)}")
        return False

def test_get_stats():
    """Test GET /api/stats"""
    try:
        response = requests.get(f"{API_BASE}/stats", timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/stats", "FAIL", f"Status: {response.status_code}")
            return False
            
        data = response.json()
        
        required_fields = ['todayJobs', 'pendingJobs', 'confirmedJobs', 'weekRevenue']
        if not all(field in data for field in required_fields):
            log_test("GET /api/stats", "FAIL", "Missing required stats fields")
            return False
            
        log_test("GET /api/stats", "PASS", 
                f"Today: {data['todayJobs']}, Pending: {data['pendingJobs']}, Revenue: ${data['weekRevenue']}")
        return True
        
    except Exception as e:
        log_test("GET /api/stats", "FAIL", f"Exception: {str(e)}")
        return False

def test_get_calendar():
    """Test GET /api/calendar"""
    try:
        # Test without filters
        response = requests.get(f"{API_BASE}/calendar", timeout=10)
        
        if response.status_code != 200:
            log_test("GET /api/calendar", "FAIL", f"Status: {response.status_code}")
            return False
            
        data = response.json()
        
        if not isinstance(data, list):
            log_test("GET /api/calendar", "FAIL", "Response is not a list")
            return False
            
        # Test with month/year filter
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        filtered_response = requests.get(
            f"{API_BASE}/calendar?month={current_month}&year={current_year}", 
            timeout=10
        )
        
        if filtered_response.status_code == 200:
            filtered_data = filtered_response.json()
            log_test("GET /api/calendar", "PASS", 
                    f"All bookings: {len(data)}, This month: {len(filtered_data)}")
        else:
            log_test("GET /api/calendar", "PASS", f"Calendar bookings: {len(data)}")
            
        return True
        
    except Exception as e:
        log_test("GET /api/calendar", "FAIL", f"Exception: {str(e)}")
        return False

def test_invalid_booking_creation():
    """Test POST /api/bookings with missing required fields"""
    try:
        # Missing required fields
        invalid_booking = {
            "customerName": "Test User",
            "email": "test@example.com"
            # Missing phone, address, preferredDate, etc.
        }
        
        response = requests.post(
            f"{API_BASE}/bookings", 
            json=invalid_booking,
            timeout=10
        )
        
        if response.status_code == 400:
            log_test("POST /api/bookings (invalid)", "PASS", "Correctly rejected invalid booking")
            return True
        else:
            log_test("POST /api/bookings (invalid)", "FAIL", f"Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        log_test("POST /api/bookings (invalid)", "FAIL", f"Exception: {str(e)}")
        return False

def test_email_preview_endpoint():
    """Test GET /api/email/preview - Email template preview endpoint"""
    try:
        # Define expected subjects for each template type
        expected_subjects = {
            "confirmation_paid": "Booking CONFIRMED",
            "confirmation_unpaid": "Booking Received", 
            "reminder": "Reminder: Your Dump Trailer",
            "dropped_off": "Trailer Has Been Delivered",
            "picked_up": "Trailer Picked Up",
            "completed": "Job Complete - Thank You",
            "followup": "Thanks for using Easy Load"
        }
        
        # Test each template type
        all_passed = True
        test_results = []
        
        for template_type, expected_subject in expected_subjects.items():
            try:
                response = requests.get(f"{API_BASE}/email/preview?type={template_type}", timeout=10)
                
                if response.status_code != 200:
                    log_test(f"Email Preview ({template_type})", "FAIL", f"Status: {response.status_code}")
                    all_passed = False
                    test_results.append((template_type, False, f"HTTP {response.status_code}"))
                    continue
                
                data = response.json()
                
                # Check required response fields
                required_fields = ['html', 'subject', 'templateName', 'type']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    log_test(f"Email Preview ({template_type})", "FAIL", f"Missing fields: {missing_fields}")
                    all_passed = False
                    test_results.append((template_type, False, f"Missing: {missing_fields}"))
                    continue
                
                # Check if subject contains expected text
                actual_subject = data['subject']
                if expected_subject not in actual_subject:
                    log_test(f"Email Preview ({template_type})", "FAIL", 
                           f"Subject mismatch. Expected: '{expected_subject}', Got: '{actual_subject}'")
                    all_passed = False
                    test_results.append((template_type, False, f"Wrong subject: {actual_subject}"))
                    continue
                
                # Check HTML content is not empty and contains expected elements
                html_content = data['html']
                if not html_content or len(html_content.strip()) == 0:
                    log_test(f"Email Preview ({template_type})", "FAIL", "Empty HTML content")
                    all_passed = False
                    test_results.append((template_type, False, "Empty HTML"))
                    continue
                
                # Check HTML contains "Easy Load & Dump"
                if "Easy Load & Dump" not in html_content:
                    log_test(f"Email Preview ({template_type})", "FAIL", "HTML missing 'Easy Load & Dump'")
                    all_passed = False
                    test_results.append((template_type, False, "Missing company name"))
                    continue
                
                # Special check for completed template - should contain REPEAT10 discount code
                if template_type == "completed" and "REPEAT10" not in html_content:
                    log_test(f"Email Preview ({template_type})", "FAIL", "Completed template missing REPEAT10 code")
                    all_passed = False
                    test_results.append((template_type, False, "Missing REPEAT10 code"))
                    continue
                
                # Check type matches request
                if data['type'] != template_type:
                    log_test(f"Email Preview ({template_type})", "FAIL", f"Type mismatch: {data['type']}")
                    all_passed = False
                    test_results.append((template_type, False, f"Wrong type: {data['type']}"))
                    continue
                
                log_test(f"Email Preview ({template_type})", "PASS", 
                        f"Subject: '{actual_subject}', Template: {data['templateName']}")
                test_results.append((template_type, True, f"Subject: {actual_subject}"))
                
            except Exception as e:
                log_test(f"Email Preview ({template_type})", "FAIL", f"Exception: {str(e)}")
                all_passed = False
                test_results.append((template_type, False, f"Exception: {str(e)}"))
        
        # Test default type (no query param)
        try:
            response = requests.get(f"{API_BASE}/email/preview", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'html' in data and 'subject' in data and data['subject']:
                    log_test("Email Preview (default)", "PASS", f"Default template: {data.get('templateName', 'N/A')}")
                    test_results.append(("default", True, f"Default: {data.get('templateName')}"))
                else:
                    log_test("Email Preview (default)", "FAIL", "Invalid default response")
                    all_passed = False
                    test_results.append(("default", False, "Invalid response"))
            else:
                log_test("Email Preview (default)", "FAIL", f"Status: {response.status_code}")
                all_passed = False
                test_results.append(("default", False, f"HTTP {response.status_code}"))
        except Exception as e:
            log_test("Email Preview (default)", "FAIL", f"Exception: {str(e)}")
            all_passed = False
            test_results.append(("default", False, f"Exception: {str(e)}"))
        
        # Test invalid type (should return fallback)
        try:
            response = requests.get(f"{API_BASE}/email/preview?type=invalid_type", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'html' in data and 'subject' in data and data['subject']:
                    log_test("Email Preview (invalid type)", "PASS", "Fallback template returned")
                    test_results.append(("invalid", True, "Fallback works"))
                else:
                    log_test("Email Preview (invalid type)", "FAIL", "No fallback response")
                    all_passed = False
                    test_results.append(("invalid", False, "No fallback"))
            else:
                log_test("Email Preview (invalid type)", "FAIL", f"Status: {response.status_code}")
                all_passed = False
                test_results.append(("invalid", False, f"HTTP {response.status_code}"))
        except Exception as e:
            log_test("Email Preview (invalid type)", "FAIL", f"Exception: {str(e)}")
            all_passed = False
            test_results.append(("invalid", False, f"Exception: {str(e)}"))
        
        # Summary for email preview tests
        passed_count = sum(1 for _, passed, _ in test_results if passed)
        total_count = len(test_results)
        
        if all_passed and passed_count == total_count:
            log_test("GET /api/email/preview (Overall)", "PASS", 
                   f"All {total_count} email template tests passed")
            return True
        else:
            log_test("GET /api/email/preview (Overall)", "FAIL", 
                   f"Only {passed_count}/{total_count} email template tests passed")
            return False
            
    except Exception as e:
        log_test("GET /api/email/preview", "FAIL", f"Exception: {str(e)}")
        return False

def run_all_tests():
    """Run all backend API tests"""
    print("🔥 Starting Backend API Tests for Easy Load & Dump")
    print("=" * 60)
    
    test_results = []
    
    # Core functionality tests (high priority)
    print("\n📋 CORE FUNCTIONALITY TESTS:")
    test_results.append(("Pricing Settings", test_pricing_get()))
    test_results.append(("Admin Login", test_admin_login()))
    test_results.append(("Auth Verification", test_auth_verify()))
    test_results.append(("Create Booking", test_create_booking()))
    test_results.append(("List Bookings", test_get_bookings()))
    test_results.append(("Get Single Booking", test_get_single_booking()))
    test_results.append(("Update Booking", test_update_booking()))
    
    print("\n👥 CUSTOMER MANAGEMENT TESTS:")
    test_results.append(("List Customers", test_get_customers()))
    test_results.append(("Get Single Customer", test_get_single_customer()))
    
    print("\n⚙️ ADMIN FUNCTIONALITY TESTS:")
    test_results.append(("Update Pricing", test_update_pricing()))
    test_results.append(("Dashboard Stats", test_get_stats()))
    test_results.append(("Calendar Data", test_get_calendar()))
    
    print("\n📧 EMAIL FUNCTIONALITY TESTS:")
    test_results.append(("Email Preview API", test_email_preview_endpoint()))
    
    print("\n🛡️ VALIDATION TESTS:")
    test_results.append(("Invalid Booking", test_invalid_booking_creation()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY:")
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {status}: {test_name}")
    
    print(f"\n🎯 OVERALL RESULT: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED! Backend is working correctly.")
        return True
    else:
        print(f"⚠️ {total - passed} test(s) failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    try:
        success = run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Unexpected error running tests: {str(e)}")
        sys.exit(1)