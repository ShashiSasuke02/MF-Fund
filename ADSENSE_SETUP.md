# Google AdSense Integration Guide

## Setup Instructions

### 1. Get Your AdSense Account
1. Visit [Google AdSense](https://www.google.com/adsense/)
2. Sign up for an account or log in
3. Complete the site verification process
4. Get your Publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXX`)

### 2. Create Ad Units
1. Go to AdSense Dashboard > Ads > Overview
2. Click "By ad unit" tab
3. Create the following ad units:

   - **Display Ad** (Responsive)
     - Size: Responsive
     - Type: Display ads
     - Name: "Main Display Ad"
   
   - **Banner Ad** (Horizontal)
     - Size: 728x90 or Responsive
     - Type: Display ads
     - Name: "Header/Footer Banner"
   
   - **Rectangle Ad** (Sidebar)
     - Size: 300x250 or Responsive
     - Type: Display ads
     - Name: "Sidebar Rectangle"
   
   - **In-Feed Ad** (Native)
     - Type: In-feed ads
     - Name: "Fund List In-Feed"

4. Copy the Ad Slot IDs for each unit

### 3. Update Configuration

#### Update `client/index.html`
Replace `ca-pub-XXXXXXXXXXXXXXXX` with your actual Publisher ID:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ID_HERE"
 crossorigin="anonymous"></script>
```

#### Update `client/src/components/AdSense.jsx`
Replace placeholder IDs with your actual Ad Slot IDs:

```javascript
// Main AdSense component - default client ID
client = 'ca-pub-YOUR_PUBLISHER_ID'

// BannerAd - horizontal banner
slot = "YOUR_BANNER_AD_SLOT_ID"

// RectangleAd - sidebar rectangle
slot = "YOUR_RECTANGLE_AD_SLOT_ID"

// DisplayAd - responsive display
slot = "YOUR_DISPLAY_AD_SLOT_ID"

// InFeedAd - in-feed native
slot = "YOUR_INFEED_AD_SLOT_ID"
```

### 4. Ad Placements in Application

Current ad placements:

1. **Landing Page** (`client/src/pages/Landing.jsx`)
   - Display Ad after Value Proposition section
   - Banner Ad in FAQ section

2. **Fund List** (`client/src/pages/FundList.jsx`)
   - In-Feed Ad after every 10 fund listings

3. **Fund Details** (`client/src/pages/FundDetails.jsx`)
   - Display Ad after NAV history table

4. **Portfolio** (`client/src/pages/Portfolio.jsx`)
   - Banner Ad after balance card

### 5. Development vs Production

- **Development Mode**: Shows placeholder boxes with "AdSense Placeholder" text
- **Production Mode**: Shows actual Google ads

To test in production mode:
```bash
# Build for production
npm run build

# Serve production build
npm start
```

### 6. AdSense Policies & Best Practices

✅ **Do's:**
- Keep ads clearly distinguishable from content
- Use responsive ad units for better mobile experience
- Limit ads to 3-4 per page
- Place ads naturally within content flow
- Monitor performance in AdSense dashboard

❌ **Don'ts:**
- Don't click your own ads
- Don't encourage users to click ads
- Don't place ads too close to buttons/links
- Don't use more than 3 display ad units per page
- Don't hide ad labels

### 7. Testing Checklist

- [ ] Publisher ID updated in `index.html`
- [ ] All Ad Slot IDs updated in `AdSense.jsx`
- [ ] Ads display correctly on Landing page
- [ ] In-feed ads appear in Fund List
- [ ] Display ad shows on Fund Details page
- [ ] Banner ad visible on Portfolio page
- [ ] Ads are responsive on mobile devices
- [ ] No console errors related to AdSense
- [ ] Site has been verified in AdSense account

### 8. Monitoring & Optimization

1. **AdSense Dashboard**
   - Track earnings daily
   - Monitor click-through rates (CTR)
   - Check page RPM (Revenue Per Mille)
   - Analyze top-performing ad units

2. **Performance Metrics**
   - Page load time impact
   - Ad viewability rates
   - User engagement metrics
   - Bounce rate changes

3. **A/B Testing**
   - Test different ad placements
   - Try various ad sizes
   - Experiment with ad colors (if applicable)
   - Monitor which pages generate most revenue

### 9. Troubleshooting

**Ads not showing?**
- Check if Publisher ID is correct
- Verify Ad Slot IDs are accurate
- Ensure site is approved by AdSense
- Check browser console for errors
- Verify NODE_ENV is set to 'production'

**Ads showing blank spaces?**
- AdSense may be still crawling your site
- Ad inventory might be limited for your niche
- Try different ad sizes/formats
- Check AdSense account for policy violations

**Performance issues?**
- Use lazy loading for below-fold ads
- Implement ad refresh limits
- Consider reducing number of ad units
- Monitor Core Web Vitals

### 10. Revenue Optimization Tips

1. **Strategic Placement**
   - Place first ad above the fold
   - Use in-content ads for better engagement
   - Test sidebar vs in-content performance

2. **Ad Density**
   - Balance user experience with revenue
   - Follow 50/50 content-to-ad ratio guideline
   - Avoid ad-heavy pages

3. **Mobile Optimization**
   - Use responsive ad units
   - Test mobile ad placements separately
   - Consider sticky footer ads for mobile

4. **Seasonal Optimization**
   - Monitor CPC trends
   - Adjust ad density during high-traffic periods
   - Test new ad formats regularly

## Support & Resources

- [AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Policies](https://support.google.com/adsense/answer/48182)
- [Ad Implementation Guide](https://support.google.com/adsense/answer/7476355)
- [Best Practices](https://support.google.com/adsense/answer/17954)

## Contact

For technical issues with ad integration, check the component implementation in:
- `client/src/components/AdSense.jsx`
- `client/index.html`
