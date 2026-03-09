#!/usr/bin/env python3
"""
Stripe Payment API for Easy Load & Dump
Uses emergentintegrations library for Stripe checkout
"""

import os
import asyncio
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import emergentintegrations Stripe module
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    CheckoutStatusResponse
)

# Initialize FastAPI
app = FastAPI(title="Stripe Payment API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
DEPOSIT_AMOUNT = 50.00  # Fixed $50 deposit
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY", "sk_test_emergent")

# In-memory transaction store (in production, use MongoDB)
payment_transactions = {}

class CreateCheckoutRequest(BaseModel):
    bookingId: str
    originUrl: str
    customerEmail: Optional[str] = None
    customerName: Optional[str] = None
    estimatedTotal: Optional[float] = None

class CheckStatusRequest(BaseModel):
    sessionId: str

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "stripe-payments"}

@app.post("/api/stripe/create-checkout")
async def create_checkout(request: Request, data: CreateCheckoutRequest):
    """Create a Stripe checkout session for booking deposit"""
    try:
        host_url = data.originUrl
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        # Initialize Stripe checkout
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Build success and cancel URLs
        success_url = f"{host_url}/booking-confirmation/{data.bookingId}?session_id={{CHECKOUT_SESSION_ID}}&payment=success"
        cancel_url = f"{host_url}/booking-confirmation/{data.bookingId}?payment=cancelled"
        
        # Create checkout session request
        checkout_request = CheckoutSessionRequest(
            amount=DEPOSIT_AMOUNT,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "bookingId": data.bookingId,
                "customerEmail": data.customerEmail or "",
                "customerName": data.customerName or "",
                "type": "booking_deposit"
            }
        )
        
        # Create the session
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction record
        transaction_id = str(uuid.uuid4())
        payment_transactions[session.session_id] = {
            "id": transaction_id,
            "bookingId": data.bookingId,
            "sessionId": session.session_id,
            "amount": DEPOSIT_AMOUNT,
            "currency": "usd",
            "status": "pending",
            "paymentStatus": "initiated",
            "customerEmail": data.customerEmail,
            "customerName": data.customerName,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
        
        return {
            "url": session.url,
            "sessionId": session.session_id
        }
        
    except Exception as e:
        print(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/stripe/check-status")
async def check_status(request: Request, data: CheckStatusRequest):
    """Check payment status for a checkout session"""
    try:
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        # Initialize Stripe checkout
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Get checkout status
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(data.sessionId)
        
        # Update transaction record if exists
        if data.sessionId in payment_transactions:
            transaction = payment_transactions[data.sessionId]
            
            if status.payment_status == "paid" and transaction["paymentStatus"] != "completed":
                transaction["status"] = "complete"
                transaction["paymentStatus"] = "completed"
                transaction["updatedAt"] = datetime.now().isoformat()
            elif status.status == "expired":
                transaction["status"] = "expired"
                transaction["paymentStatus"] = "expired"
                transaction["updatedAt"] = datetime.now().isoformat()
        
        return {
            "status": status.status,
            "paymentStatus": status.payment_status,
            "amount": status.amount_total / 100,  # Convert from cents
            "currency": status.currency,
            "metadata": status.metadata
        }
        
    except Exception as e:
        print(f"Status check error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature", "")
        
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook event
        if webhook_response.session_id and webhook_response.session_id in payment_transactions:
            transaction = payment_transactions[webhook_response.session_id]
            
            if webhook_response.payment_status == "paid":
                transaction["status"] = "complete"
                transaction["paymentStatus"] = "completed"
                transaction["updatedAt"] = datetime.now().isoformat()
        
        return {"received": True, "event_type": webhook_response.event_type}
        
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"received": True, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
