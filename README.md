# SuitesMine Bot - CloudBeds Availability Checker

A Botpress workflow for checking room availability through CloudBeds API.

## Files

- `availability-workflow.json` - Production workflow with CloudBeds API integration
- `test-availability-workflow.json` - Test workflow with mock data (no API required)
- `botpress-config.json` - Botpress bot configuration
- `deployment-guide.md` - Step-by-step deployment instructions

## Features

- ✅ Natural language date extraction
- ✅ Guest count detection
- ✅ Room availability checking
- ✅ Price and occupancy display
- ❌ Booking functionality (removed as requested)

## Test Version

The test version includes mock data for:
- Ocean View Suite ($450/night, max 4 guests)
- Garden Villa ($350/night, max 2 guests)
- Master Pool Suite ($650/night, max 6 guests)

## Setup

1. Import the workflow into Botpress
2. Configure CloudBeds API credentials (production only)
3. Deploy to your bot
4. Test with sample queries

## Sample Queries

- "Check availability from 2024-03-15 to 2024-03-18 for 2 guests"
- "Do you have rooms available March 15-18?"
- "Availability for 4 people next weekend"
