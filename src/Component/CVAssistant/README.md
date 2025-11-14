# CV / Profile Assistant - Feature Documentation

## 🎯 Overview
একটি AI-powered CV Assistant যা আপনার profile data থেকে automatically professional CV generate করে এবং AI suggestions প্রদান করে।

## ✨ Features

### 1. **CV Preview (👁️)**
- আপনার সম্পূর্ণ profile data একটি professional CV format এ দেখায়
- Dark theme styling সহ clean এবং modern design
- সব sections include: Summary, Skills, Experience, Projects, Education

### 2. **AI Suggestions (🤖)**
Generate করে:
- ✨ **Professional Summary**: Tailored professional summary আপনার experience অনুযায়ী
- 📝 **Experience Bullets**: Strong bullet points STAR method ব্যবহার করে
- 🚀 **Project Bullets**: Enhanced project descriptions
- 💼 **LinkedIn Tips**: 5টি specific optimization recommendations
- 🌐 **Portfolio Tips**: 5টি portfolio improvement suggestions

### 3. **Apply to Profile (✨)**
**নতুন Feature!** AI suggestions directly আপনার profile এ apply করতে পারবেন:
- **Professional Summary**: One-click এ bio update
- **Experience Bullets**: Automatically experience descriptions update
- **Project Bullets**: Automatically project descriptions update
- Real-time Firebase sync সহ

### 4. **Export Options**
- **📥 Export PDF**: High-quality PDF download
- **🖨️ Print**: Direct printing support
- **📋 Copy**: Individual suggestions copy to clipboard

## 🚀 How to Use

### Access CV Assistant:
1. Dashboard → Profile (👤 icon)
2. Left sidebar এ scroll down করুন
3. **"📄 CV Assistant"** সবুজ বাটনে click করুন

### Generate AI Suggestions:
1. CV Assistant modal খুলুন
2. **"🤖 AI Suggestions"** tab এ যান
3. **"✨ Generate AI Suggestions"** button click করুন
4. Wait for AI to generate (5-10 seconds)

### Apply Suggestions to Profile:
1. Generated suggestion এর নিচে **"✨ Apply to Profile"** button দেখবেন
2. Click করলে automatically আপনার profile update হবে
3. Success notification দেখবেন ✅
4. Profile page refresh করলে changes দেখতে পাবেন

### Export CV:
1. **"👁️ Preview"** tab এ যান
2. **"📥 Export PDF"** button click করুন
3. PDF download হবে আপনার computer এ

## 🛠️ Technical Details

### Files Created:
- `CVAssistant.jsx` - Main component
- `CVAssistant.css` - Dark theme styling
- `cvAssistantService.js` - AI service integration

### Dependencies:
- `html2canvas` - For PDF generation
- `jspdf` - For PDF export
- `@google/generative-ai` - For AI suggestions (Gemini API)
- Firebase Firestore - For data storage

### API Integration:
- Uses Google Gemini 2.5 Flash model
- Fallback to template-based suggestions if API unavailable
- API key: Configure in `.env` file as `REACT_APP_GEMINI_API_KEY`

## 📝 Notes

### AI Suggestions:
- প্রথমবার generation এ 5-10 seconds সময় লাগতে পারে
- Internet connection প্রয়োজন
- API key না থাকলে template-based suggestions ব্যবহার হবে

### Apply Feature:
- Apply করলে Firebase এ instantly save হয়
- Profile page এ real-time update দেখতে পাবেন
- Undo feature নেই, তাই সাবধানে apply করুন

### PDF Export:
- High-quality rendering (scale: 2x)
- A4 paper size format
- Dark theme maintained in PDF
- Print option ও available

## 🎨 Styling
- Consistent dark theme (#0a0e27 background)
- Purple accent colors (#6366f1)
- Smooth animations and transitions
- Fully responsive design
- Print-optimized styles

## 🔐 Security
- Firebase authentication required
- User-specific data only
- API key stored in environment variables
- No data shared between users

## 🐛 Troubleshooting

### AI Suggestions না আসলে:
1. Check internet connection
2. Verify Gemini API key in `.env`
3. Check browser console for errors
4. Fallback suggestions automatically load হবে

### Apply না হলে:
1. Ensure logged in
2. Check Firebase connection
3. Verify profile data exists
4. Check browser console for errors

### PDF Export না হলে:
1. Check browser permissions
2. Disable ad blockers temporarily
3. Try print option instead
4. Check browser console for errors

---

**Created:** November 2025  
**Version:** 1.0.0  
**Developer:** GitHub Copilot + PathX Team
