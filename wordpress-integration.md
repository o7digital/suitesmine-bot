# WordPress Integration Guide

## Overview
This guide explains how to integrate the SuitesMine availability checker bot with your WordPress WPMU site.

## Method 1: Botpress Webchat Widget (Recommended)

### Step 1: Get Embed Code
1. Login to Botpress Cloud
2. Go to your bot dashboard
3. Navigate to "Integrations" → "Webchat"
4. Copy the embed code (looks like this):
```html
<script src="https://cdn.botpress.cloud/webchat/v1/inject.js"></script>
<script>
  window.botpressWebChat.init({
    botId: "your-bot-id",
    hostUrl: "https://cdn.botpress.cloud/webchat/v1",
    messagingUrl: "https://messaging.botpress.cloud",
    clientId: "your-client-id"
  });
</script>
```

### Step 2: Add to WordPress
1. Go to WordPress Admin → Appearance → Theme Editor
2. Edit `footer.php` or use a plugin like "Insert Headers and Footers"
3. Add the embed code before `</body>` tag
4. Save changes

### Step 3: Customize Appearance
Add CSS to customize the chat widget:
```css
/* Customize chat button */
.bp-widget-btn {
  background-color: #your-brand-color !important;
  bottom: 20px !important;
  right: 20px !important;
}

/* Customize chat window */
.bp-widget-container {
  font-family: your-font-family !important;
}
```

## Method 2: Custom Page Integration

### Create Dedicated Chat Page
1. Create new WordPress page: "Check Availability"
2. Add custom HTML block with full-screen chat:
```html
<div id="availability-chat" style="height: 600px; width: 100%;">
  <!-- Botpress embed code here -->
</div>
<style>
  .bp-widget-container {
    height: 100% !important;
    width: 100% !important;
  }
</style>
```

## Method 3: Shortcode Integration

### Create Custom Shortcode
Add to your theme's `functions.php`:
```php
function availability_checker_shortcode() {
    return '
    <div class="availability-checker">
        <script src="https://cdn.botpress.cloud/webchat/v1/inject.js"></script>
        <script>
          window.botpressWebChat.init({
            botId: "your-bot-id",
            hostUrl: "https://cdn.botpress.cloud/webchat/v1",
            messagingUrl: "https://messaging.botpress.cloud",
            clientId: "your-client-id"
          });
        </script>
    </div>';
}
add_shortcode('availability_checker', 'availability_checker_shortcode');
```

Use shortcode in posts/pages: `[availability_checker]`

## Method 4: WPMU Network Integration

### For Multi-Site Setup
1. Add embed code to network-wide footer
2. Or create a plugin for network activation
3. Configure per-site if needed

## Styling Tips

### Match Your Theme
```css
/* Chat button styling */
.bp-widget-btn {
  background: linear-gradient(45deg, #your-primary, #your-secondary);
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

/* Chat window styling */
.bp-widget-container {
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

/* Message bubbles */
.bp-message-content {
  border-radius: 18px;
  font-size: 14px;
}
```

## Testing

1. Clear WordPress cache
2. Visit your site in incognito mode
3. Test the chat widget
4. Try sample queries:
   - "Check availability for March 15-18"
   - "Do you have rooms for 2 guests?"

## Troubleshooting

### Common Issues:
- **Widget not showing**: Check if JavaScript is blocked
- **Styling conflicts**: Use `!important` in CSS
- **Mobile issues**: Test responsive design
- **WPMU conflicts**: Check network settings

### Debug Steps:
1. Check browser console for errors
2. Verify embed code is correct
3. Test on different devices/browsers
4. Check WordPress plugin conflicts

## Performance Optimization

1. Load chat widget only on relevant pages
2. Use lazy loading for better performance
3. Minify CSS/JS if possible
4. Consider caching implications

## Security Considerations

1. Ensure HTTPS is enabled
2. Validate Botpress domain in CSP headers
3. Regular security updates
4. Monitor for suspicious activity
