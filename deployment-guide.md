# Botpress Deployment Guide

## Step 1: Login to Botpress

1. Go to https://app.botpress.cloud
2. Login with: olivier.steineur@gmail.com
3. Password: 2Ai0n928@!

## Step 2: Create or Select Bot

1. Create a new bot or select existing bot
2. Go to the "Flows" section

## Step 3: Import Workflow

### For Testing (Recommended First):
1. Copy content from `test-availability-workflow.json`
2. In Botpress, create a new flow called "Availability Checker Test"
3. Paste the JSON content
4. Save and publish

### For Production (After Testing):
1. Copy content from `availability-workflow.json`
2. Create a new flow called "Availability Checker"
3. Paste the JSON content
4. Configure environment variables:
   - `CLOUDBED_API_KEY`: Your CloudBeds API key
   - `CLOUDBED_PROPERTY_ID`: Your property ID

## Step 4: Test the Bot

### Test Queries:
- "Check availability from 2025-03-15 to 2025-03-18 for 2 guests"
- "Do you have rooms available March 15-18?"
- "Availability for 4 people"

## Step 5: WordPress Integration

### Option 1: Botpress Widget
1. In Botpress, go to "Integrations" → "Webchat"
2. Copy the embed code
3. Add to your WordPress site's footer or specific pages

### Option 2: Custom Integration
1. Use Botpress API to create custom chat interface
2. Integrate with your WordPress theme

## CloudBeds API Setup (Production Only)

1. Login to your CloudBeds account
2. Go to API settings
3. Generate API key
4. Get your Property ID
5. Add these to Botpress environment variables

## Troubleshooting

- Test version should work immediately without API
- Production version requires valid CloudBeds credentials
- Check Botpress logs for any errors
- Verify date formats are recognized correctly

## Next Steps

1. Test with mock data first
2. Get CloudBeds API credentials
3. Switch to production workflow
4. Integrate with WordPress site
