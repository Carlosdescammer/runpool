# 🧪 Stripe Payment Testing Guide

## Quick Setup for Local Testing

### 1. Environment Variables
Add these to your `.env.local` file:

```bash
# Stripe Test Keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Connect (for payouts)
NEXT_PUBLIC_STRIPE_CLIENT_ID=ca_...
```

### 2. Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login
```

### 3. Test Webhook Locally
```bash
# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will give you a webhook secret like: whsec_1234...
# Copy this to your .env.local as STRIPE_WEBHOOK_SECRET
```

## 🧪 Test Payment Flows

### Test Card Numbers
```
✅ Success: 4242424242424242
❌ Decline: 4000000000000002
🔄 3D Secure: 4000002500003155
💳 Visa: 4242424242424242
💳 Mastercard: 5555555555554444
```

### Test Flow Steps

1. **Start Local Server**
   ```bash
   npm run dev
   ```

2. **Start Webhook Forwarding**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Test Payment Process**
   - Go to a group page
   - Click "Enter This Week" 
   - Use test card: `4242424242424242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)

4. **Check Webhook Events**
   - Watch the Stripe CLI output
   - Should see `payment_intent.succeeded` events
   - Check your terminal for webhook processing logs

## 🔍 Testing Checklist

### Payment Intent Creation
- [ ] Payment form loads correctly
- [ ] Test card processes successfully
- [ ] Payment intent created in Stripe dashboard
- [ ] User entry recorded in database

### Webhook Processing  
- [ ] `payment_intent.succeeded` webhook received
- [ ] Email notification sent (check logs)
- [ ] User status updated in database
- [ ] Challenge pot amount updated

### Error Handling
- [ ] Declined card shows error message
- [ ] Network errors handled gracefully
- [ ] Duplicate payments prevented

## 🎯 Key Endpoints to Test

### Payment Creation
```
POST /api/payments/create-intent
Body: { weekId: "uuid", amount: 2500 }
```

### Webhook Handler
```
POST /api/webhooks/stripe
Headers: stripe-signature
```

### Email Notifications
```
POST /api/notify/payment-success
POST /api/notify/payment-failure
```

## 🚨 Common Issues

**Webhook Secret Mismatch**
- Make sure `STRIPE_WEBHOOK_SECRET` matches CLI output
- Restart your dev server after updating .env.local

**CORS Errors**
- Stripe elements need to be served over HTTPS in production
- Use `localhost` (not `127.0.0.1`) for local testing

**Database Permissions**
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- Check RLS policies allow webhook operations

## 📊 Monitor Test Results

1. **Stripe Dashboard**: https://dashboard.stripe.com/test/payments
2. **Supabase Database**: Check `user_weeks` and `weeks` tables
3. **Email Logs**: Check terminal output for email sending
4. **Webhook Logs**: Monitor Stripe CLI output

## 🔄 Reset Test Data

```sql
-- Clear test payments (run in Supabase SQL editor)
DELETE FROM user_weeks WHERE created_at > '2024-01-01';
UPDATE weeks SET pot = 0 WHERE created_at > '2024-01-01';
```

---

**💡 Pro Tip**: Keep the Stripe CLI running in a separate terminal while testing to see real-time webhook events!
