# PathX

## Project Overview

PathX is a comprehensive career development platform designed to connect youth with employment opportunities aligned with SDG 8 (Decent Work and Economic Growth). The platform provides personalized job recommendations, AI-powered career guidance, skill extraction from CVs, roadmap generation, and learning resources tailored to individual career goals.

## Tech Stack

### Frontend
- **React 18.3.1** - UI library for building interactive user interfaces
- **React Router DOM 6.28.0** - Client-side routing
- **Chart.js 4.4.7** & **react-chartjs-2 5.3.0** - Data visualization
- **html2canvas 1.4.1** & **jspdf 2.5.2** - PDF generation and export
- **pdfjs-dist 5.4.394** - PDF parsing for skill extraction

### Backend & Services
- **Firebase 10.14.1** - Backend-as-a-Service
  - Firebase Authentication - User authentication and authorization
  - Cloud Firestore - NoSQL database for storing user profiles, jobs, courses, and roadmaps
  - Firebase Storage - File storage for user-uploaded CVs and profile pictures

### AI Integration
- **Google Gemini AI API** - Powers multiple AI features:
  - Skill extraction from PDF/text CVs
  - Job matching and recommendations
  - Career roadmap generation
  - CV optimization suggestions
  - AI career mentor chatbot

### Additional Libraries
- **react-icons 5.4.0** - Icon components
- **Web Vitals** - Performance monitoring

## Project Structure

```
PathX/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── images/
├── src/
│   ├── firebase.js                      # Firebase configuration
│   ├── App.js                           # Main application component
│   ├── index.js                         # Application entry point
│   ├── Component/
│   │   ├── Homepage/                    # Landing page
│   │   ├── Login/                       # Authentication (Login/Signup)
│   │   ├── UserDashboard/               # User dashboard with analytics
│   │   ├── Jobs/                        # Job listings with AI matching
│   │   ├── Course/                      # Learning resources
│   │   ├── Roadmap/                     # AI-generated career roadmaps
│   │   ├── CareerBot/                   # AI career mentor chatbot
│   │   ├── Profile/                     # User profile management
│   │   ├── SkillExtraction/             # AI CV skill extraction
│   │   ├── CVAssistant/                 # AI-powered CV optimization
│   │   ├── JobMatching/                 # AI job recommendation engine
│   │   ├── AdminDashboard/              # Admin panel for content management
│   │   ├── Sidebar/                     # Unified navigation sidebar
│   │   ├── Navbar/                      # Navigation bar
│   │   └── Footer/                      # Footer component
│   ├── config/
│   │   └── geminiConfig.js              # Gemini AI configuration
│   ├── services/
│   │   ├── adminAuthService.js          # Admin authentication service
│   │   └── apiProviderService.js        # API provider management
│   └── utils/
│       ├── skillExtractor.js            # PDF/text skill extraction utility
│       └── roadmapService.js            # Roadmap generation service
└── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Google Gemini API key

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Jannatul-Ferdauss/PathX.git
   cd PathX-real/PathX-main
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   
   Create a `src/firebase.js` file with your Firebase credentials:
   ```javascript
   import { initializeApp } from 'firebase/app';
   import { getAuth } from 'firebase/auth';
   import { getFirestore } from 'firebase/firestore';
   import { getStorage } from 'firebase/storage';

   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };

   const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   export const storage = getStorage(app);
   ```

4. **Gemini AI Configuration**
   
   Create a `src/config/geminiConfig.js` file:
   ```javascript
   export const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
   export const GEMINI_MODEL = 'gemini-2.0-flash-exp';
   export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
   ```

5. **Environment Variables (Optional)**
   
   Create a `.env` file in the root directory:
   ```
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key
   ```

6. **Run the Application**
   ```bash
   npm start
   ```
   
   The application will open at `http://localhost:3000`

### Build for Production
```bash
npm run build
```

## Firebase Firestore Database Structure

### Collections

1. **users** - User profiles
   ```javascript
   {
     id: string,
     name: string,
     email: string,
     title: string,
     bio: string,
     skills: string[],
     careerInterests: string,
     basic: {
       location: string,
       availability: string,
       age: string,
       exp: string,
       desiredSkill: string[],
       rating: string
     },
     experiences: array,
     education: array,
     projects: array,
     cvText: string,
     cvLink: string,
     profilePicture: string,
     isAdmin: boolean
   }
   ```

2. **jobs** - Job listings
   ```javascript
   {
     id: string,
     title: string,
     company: string,
     location: string,
     type: string,
     description: string,
     requirements: string[],
     salary: string,
     postedDate: timestamp,
     logo: string
   }
   ```

3. **courses** - Learning resources
   ```javascript
   {
     id: string,
     title: string,
     platform: string,
     url: string,
     relatedSkills: string[],
     costIndicator: string,
     logo: string
   }
   ```

4. **roadmaps** - AI-generated career roadmaps
   ```javascript
   {
     id: string,
     userId: string,
     targetRole: string,
     currentSkills: string,
     timeframe: number,
     weeklyHours: number,
     generatedAt: timestamp,
     roadmapContent: object
   }
   ```

5. **conversations** - Career bot chat history
   ```javascript
   {
     id: string,
     userId: string,
     messages: array,
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

## API Documentation

### Google Gemini AI API

**Base URL:** `https://generativelanguage.googleapis.com/v1beta/models`

**Model Used:** `gemini-2.0-flash-exp`

**Authentication:** API Key passed as query parameter

#### Features Powered by Gemini AI

1. **Skill Extraction** (`src/utils/skillExtractor.js`)
   - Endpoint: `/gemini-2.0-flash-exp:generateContent`
   - Input: CV text (from PDF or TXT file)
   - Output: Structured JSON with extracted skills

2. **Job Matching** (`src/Component/JobMatching/jobMatchingService.js`)
   - Analyzes user skills and job requirements
   - Provides match scores and recommendations
   - Generates skill gap analysis

3. **Career Roadmap Generation** (`src/utils/roadmapService.js`)
   - Creates personalized learning paths
   - Structures weekly milestones and resources
   - Adapts to user's time availability

4. **Career Bot** (`src/Component/CareerBot/careerBotService.js`)
   - Real-time conversational AI career guidance
   - Context-aware responses based on user profile
   - Provides career advice, interview prep, and skill recommendations

5. **CV Optimization** (`src/Component/CVAssistant/cvAssistantService.js`)
   - Generates professional summaries
   - Creates ATS-friendly bullet points
   - Provides LinkedIn and portfolio recommendations

### Firebase APIs

**Authentication API**
- Email/Password authentication
- User session management
- Admin role verification

**Firestore API**
- Real-time data synchronization with `onSnapshot`
- CRUD operations for all collections
- Query filtering and sorting

**Storage API**
- CV file uploads
- Profile picture storage
- Secure file access with authentication

## Admin Setup

### Creating an Admin User

1. **Register a Regular User**
   - Sign up through the normal registration process

2. **Promote to Admin**
   
   Run this script in Firebase Console or use the provided `makeAdmin.js`:
   ```javascript
   import { doc, updateDoc } from 'firebase/firestore';
   import { db } from './firebase';

   const makeAdmin = async (userEmail) => {
     const userDoc = doc(db, 'users', userEmail);
     await updateDoc(userDoc, { isAdmin: true });
   };
   ```

3. **Admin Features**
   - Add/Edit/Delete jobs
   - Add/Edit/Delete courses
   - View user analytics
   - Manage platform content

## Features

### User Features
- **Authentication** - Secure login and registration
- **Profile Management** - Edit personal information, skills, and career goals
- **Skill Extraction** - Upload CV (PDF/TXT) and extract skills using AI
- **Job Recommendations** - AI-powered job matching based on skills
- **Learning Resources** - Curated courses filtered by desired skills
- **Career Roadmap** - AI-generated personalized learning paths
- **Career Mentor** - AI chatbot for career guidance and advice
- **CV Assistant** - AI-powered CV optimization and PDF export
- **Dashboard Analytics** - Visual progress tracking with charts

### Admin Features
- **Job Management** - Add, edit, and delete job postings
- **Course Management** - Manage learning resources
- **User Analytics** - View platform statistics
- **Content Moderation** - Monitor and manage user-generated content

## Seed Data

The application requires initial seed data for jobs and courses. Admin users can add this data through the Admin Dashboard.

### Sample Job Entry
```javascript
{
  title: "Frontend Developer",
  company: "Tech Company",
  location: "Dhaka, Bangladesh",
  type: "Full-time",
  description: "We are looking for a skilled frontend developer...",
  requirements: ["React", "JavaScript", "CSS", "HTML"],
  salary: "BDT 50,000 - 80,000",
  postedDate: Firebase.Timestamp.now(),
  logo: "/images/company-logo.png"
}
```

### Sample Course Entry
```javascript
{
  title: "Complete React Developer Course",
  platform: "Udemy",
  url: "https://www.udemy.com/course/react-complete",
  relatedSkills: ["React", "JavaScript", "Frontend"],
  costIndicator: "Paid",
  logo: "/images/udemy.png"
}
```

## External APIs and Services

### Required Services

1. **Firebase**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password)
   - Enable Cloud Firestore
   - Enable Firebase Storage
   - Copy configuration to `src/firebase.js`

2. **Google Gemini AI**
   - Get API key from https://ai.google.dev/
   - Enable Gemini API in your Google Cloud Console
   - Add API key to `src/config/geminiConfig.js`

### API Rate Limits and Quotas

- **Gemini AI**: Free tier includes 60 requests per minute
- **Firebase**: Spark (free) plan has daily limits on reads/writes
- **Firebase Storage**: Free tier includes 1GB storage and 10GB/month transfer

## Development

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (irreversible)

### Code Structure Guidelines

- Components follow functional component pattern with hooks
- Firestore operations use real-time listeners (`onSnapshot`)
- AI features include loading states and error handling
- All external API calls wrapped in try-catch blocks
- Dark theme with consistent color palette (#0a0e27, #1a1f3a, #6366f1)

## Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Verify Firebase configuration in `firebase.js`
   - Check Firebase project settings and rules

2. **Gemini AI Rate Limit**
   - Monitor API usage in Google Cloud Console
   - Implement request throttling if needed

3. **PDF Parsing Issues**
   - Ensure pdfjs-dist worker is properly configured
   - Check PDF file format compatibility

4. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact the PathX development team.

Repository: https://github.com/Jannatul-Ferdauss/PathX
