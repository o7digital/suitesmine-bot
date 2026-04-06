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
 4. Configure environment variables (Cloudbeds OAuth):
    - `CLOUDBEDS_CLIENT_ID`: Your Cloudbeds client ID
    - `CLOUDBEDS_CLIENT_SECRET`: Your Cloudbeds client secret
    - `CLOUDBEDS_PROPERTY_ID`: Your property ID (e.g. 319424)
    - `CLOUDBEDS_TOKEN_URL` (optional): Defaults to https://hotels.cloudbeds.com/connect/token
    - `CLOUDBEDS_API_BASE` (optional): Defaults to https://hotels.cloudbeds.com/api/v1.1

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

## Cloudbeds API Setup (Production Only)

1. Log in to Cloudbeds Connect for your test property: https://hotels.cloudbeds.com/connect/319424
2. Go to "API Credentials" and create a client (Client ID/Secret)
3. Note your Property ID (e.g. 319424)
4. Add the values to your bot environment (see variables above)
5. The bot will obtain an access token via OAuth before calling the availability API

---

## Déploiement sur Railway (en français)

Cette section couvre l'ajout des variables Cloudbeds quand votre bot tourne sur Railway.

### Variables d'environnement requises

- `CLOUDBEDS_CLIENT_ID` : ID client OAuth Cloudbeds
- `CLOUDBEDS_CLIENT_SECRET` : Secret client OAuth Cloudbeds
- `CLOUDBEDS_PROPERTY_ID` : ID propriété Cloudbeds (ex. 319424)
- `CLOUDBEDS_TOKEN_URL` (optionnel) : défaut `https://hotels.cloudbeds.com/connect/token`
- `CLOUDBEDS_API_BASE` (optionnel) : défaut `https://hotels.cloudbeds.com/api/v1.1`

### Étapes Railway
1. Dans Railway → votre service → Variables, ajoutez les clés ci-dessus (copier/coller depuis [.env.example](.env.example)).
2. Redéployez le service pour propager les variables.
3. Ouvrez les logs Railway et vérifiez que le bot obtient un token OAuth avant l'appel d'availability.
4. Testez: « Check availability from 2025-03-15 to 2025-03-18 for 2 guests ».

Remarques:
- Si vous auto-hébergez Botpress sur Railway, assurez-vous que votre instance Botpress est correctement configurée (base de données, configuration serveur, etc.). Cette doc se concentre sur les variables Cloudbeds nécessaires au workflow.
- Selon votre stack, vous devrez peut‑être définir `PORT=3000`. Vérifiez la configuration de votre service.

## Troubleshooting

- Test version should work immediately without API
- Production version requires valid CloudBeds credentials
- Check Botpress logs for any errors
- Verify date formats are recognized correctly

### Quick OAuth Test
1. Set environment vars (`CLOUDBEDS_CLIENT_ID`, `CLOUDBEDS_CLIENT_SECRET`, `CLOUDBEDS_PROPERTY_ID`)
2. Redeploy/publish your bot so env changes apply
3. Ask: "Check availability for 2 guests from 2025-03-15 to 2025-03-18"
4. If it fails, check Botpress logs for token request/availability errors

## Next Steps

1. Test with mock data first
2. Get CloudBeds API credentials
3. Switch to production workflow
4. Integrate with WordPress site
