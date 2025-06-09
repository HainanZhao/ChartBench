# LightningChart License Setup Guide

## Getting a Free 30-Day Trial License

### Step 1: Sign Up for Trial
1. Visit [LightningChart JS Trial Page](https://lightningchart.com/js-charts/)
2. Click on "Start 30-Day Free Trial" button
3. Fill out the registration form with your details
4. You'll receive an email with your license key

### Step 2: Configure License in Project
Once you receive your license key, add it to the LightningChart component:

1. Open `src/app/components/lightning-charts.component.ts`
2. Find this line:
```typescript
private readonly LIGHTNING_CHART_LICENSE = '';
```
3. Replace the empty string with your license key:
```typescript
private readonly LIGHTNING_CHART_LICENSE = 'YOUR_LICENSE_KEY_HERE';
```

### Step 3: Restart Development Server
After adding the license key, the application will automatically reload and the license will be applied.

## Current Status ✅
The application is now configured to:
- ✅ Work with a valid license key (no watermark)
- ✅ Work without a license key (with watermark)
- ✅ Show helpful error message if LightningChart fails to initialize
- ✅ Continue working with ECharts and Lightweight Charts regardless of LightningChart status
- ✅ Display all three charts with standardized time data format

## Testing Without License
You can test the application immediately without a license. LightningChart will display with a watermark, but all functionality will work normally. The other two charts (ECharts and TradingView Lightweight Charts) work without any license requirements.

## Troubleshooting

### License Key Not Working
- Make sure there are no extra spaces in the license key
- Verify the key is in quotes in the component file
- Check the browser console for specific error messages
- Contact LightningChart support if the key appears invalid

### License Key Location
The license key should be added to:
```
src/app/components/lightning-charts.component.ts
```
Look for the line:
```typescript
private readonly LIGHTNING_CHART_LICENSE = '';
```
