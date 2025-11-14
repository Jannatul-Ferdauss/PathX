// Sample Jobs Data for Testing Job Matching System
// Run this script to populate your Firestore with sample jobs

import { collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";

const sampleJobs = [
  {
    title: "Frontend Developer",
    company: "TechVerse Ltd.",
    location: "Dhaka, Bangladesh",
    type: "Full-time",
    level: "Mid-level",
    track: "Frontend",
    skills: ["React", "JavaScript", "TypeScript", "CSS", "Redux"],
    description: "We're looking for a talented Frontend Developer to join our dynamic team. You'll be working on cutting-edge web applications using React and modern JavaScript frameworks.",
    logo: "https://ui-avatars.com/api/?name=TechVerse&background=6366f1&color=fff&size=128"
  },
  {
    title: "Junior Web Developer",
    company: "StartupHub",
    location: "Dhaka, Bangladesh",
    type: "Full-time",
    level: "Entry-level",
    track: "Full Stack",
    skills: ["HTML", "CSS", "JavaScript", "React", "Node.js"],
    description: "Perfect opportunity for fresh graduates! Learn and grow with our mentorship program while building real-world applications.",
    logo: "https://ui-avatars.com/api/?name=StartupHub&background=18e7f5&color=000&size=128"
  },
  {
    title: "Backend Developer",
    company: "DataFlow Systems",
    location: "Remote",
    type: "Full-time",
    level: "Senior",
    track: "Backend",
    skills: ["Node.js", "Python", "MongoDB", "PostgreSQL", "AWS", "Docker"],
    description: "Join our backend team to architect scalable microservices. Experience with cloud platforms and containerization required.",
    logo: "https://ui-avatars.com/api/?name=DataFlow&background=7c3aed&color=fff&size=128"
  },
  {
    title: "UI/UX Designer Intern",
    company: "CreativeMinds",
    location: "Dhaka, Bangladesh",
    type: "Internship",
    level: "Entry-level",
    track: "Design",
    skills: ["Figma", "Adobe XD", "Photoshop", "HTML", "CSS"],
    description: "3-month paid internship for aspiring designers. Learn from industry experts and work on real client projects.",
    logo: "https://ui-avatars.com/api/?name=CreativeMinds&background=f59e0b&color=000&size=128"
  },
  {
    title: "React Native Developer",
    company: "MobileFirst Inc.",
    location: "Remote",
    type: "Freelance",
    level: "Mid-level",
    track: "Mobile",
    skills: ["React Native", "JavaScript", "TypeScript", "Redux", "Firebase"],
    description: "Freelance opportunity to build cross-platform mobile applications. Flexible hours and competitive rates.",
    logo: "https://ui-avatars.com/api/?name=MobileFirst&background=10b981&color=fff&size=128"
  },
  {
    title: "DevOps Engineer",
    company: "CloudTech Solutions",
    location: "Dhaka, Bangladesh",
    type: "Full-time",
    level: "Mid-level",
    track: "DevOps",
    skills: ["AWS", "Docker", "Kubernetes", "Jenkins", "Python", "Terraform"],
    description: "Manage CI/CD pipelines and cloud infrastructure. Experience with AWS and containerization is essential.",
    logo: "https://ui-avatars.com/api/?name=CloudTech&background=3b82f6&color=fff&size=128"
  },
  {
    title: "Python Developer",
    company: "DataScience Lab",
    location: "Dhaka, Bangladesh",
    type: "Part-time",
    level: "Entry-level",
    track: "Backend",
    skills: ["Python", "Django", "Flask", "SQL", "Git"],
    description: "Part-time position perfect for students. Work on data processing and web development projects using Python.",
    logo: "https://ui-avatars.com/api/?name=DataScience&background=ef4444&color=fff&size=128"
  },
  {
    title: "Full Stack Developer",
    company: "WebSolutions Pro",
    location: "Chittagong, Bangladesh",
    type: "Full-time",
    level: "Senior",
    track: "Full Stack",
    skills: ["React", "Node.js", "MongoDB", "Express", "TypeScript", "AWS"],
    description: "Lead full stack development projects from conception to deployment. Mentor junior developers and drive technical decisions.",
    logo: "https://ui-avatars.com/api/?name=WebSolutions&background=8b5cf6&color=fff&size=128"
  },
  {
    title: "WordPress Developer",
    company: "DigitalAgency BD",
    location: "Dhaka, Bangladesh",
    type: "Freelance",
    level: "Entry-level",
    track: "Web Development",
    skills: ["WordPress", "PHP", "HTML", "CSS", "JavaScript"],
    description: "Freelance WordPress development for client websites. Flexible schedule, project-based compensation.",
    logo: "https://ui-avatars.com/api/?name=DigitalAgency&background=06b6d4&color=fff&size=128"
  },
  {
    title: "Machine Learning Engineer",
    company: "AI Innovations",
    location: "Remote",
    type: "Full-time",
    level: "Senior",
    track: "AI/ML",
    skills: ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning", "NLP"],
    description: "Work on cutting-edge AI projects. Experience with ML frameworks and production deployment required.",
    logo: "https://ui-avatars.com/api/?name=AI+Innovations&background=ec4899&color=fff&size=128"
  },
  {
    title: "Quality Assurance Tester",
    company: "QualityFirst",
    location: "Dhaka, Bangladesh",
    type: "Part-time",
    level: "Entry-level",
    track: "QA",
    skills: ["Manual Testing", "Selenium", "JavaScript", "Test Automation"],
    description: "Join our QA team to ensure software quality. Training provided for automation tools.",
    logo: "https://ui-avatars.com/api/?name=QualityFirst&background=14b8a6&color=fff&size=128"
  },
  {
    title: "Frontend Intern",
    company: "LearnTech Academy",
    location: "Dhaka, Bangladesh",
    type: "Internship",
    level: "Entry-level",
    track: "Frontend",
    skills: ["HTML", "CSS", "JavaScript", "React"],
    description: "3-month internship with certification. Perfect for beginners wanting to break into web development.",
    logo: "https://ui-avatars.com/api/?name=LearnTech&background=f97316&color=fff&size=128"
  }
];

// Function to clear existing jobs (optional - use with caution!)
export const clearJobs = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "jobs"));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log(`✅ Cleared ${querySnapshot.size} existing jobs`);
  } catch (error) {
    console.error("❌ Error clearing jobs:", error);
  }
};

// Function to seed sample jobs
export const seedJobs = async (clearFirst = false) => {
  try {
    console.log("🌱 Starting to seed jobs...");
    
    // Optionally clear existing jobs first
    if (clearFirst) {
      await clearJobs();
    }
    
    // Add all sample jobs
    const addPromises = sampleJobs.map(job => 
      addDoc(collection(db, "jobs"), job)
    );
    
    await Promise.all(addPromises);
    
    console.log(`✅ Successfully seeded ${sampleJobs.length} jobs!`);
    console.log("📊 Job types:", {
      "Full-time": sampleJobs.filter(j => j.type === "Full-time").length,
      "Part-time": sampleJobs.filter(j => j.type === "Part-time").length,
      "Internship": sampleJobs.filter(j => j.type === "Internship").length,
      "Freelance": sampleJobs.filter(j => j.type === "Freelance").length,
    });
    console.log("📍 Locations:", {
      "Dhaka": sampleJobs.filter(j => j.location.includes("Dhaka")).length,
      "Remote": sampleJobs.filter(j => j.location === "Remote").length,
      "Other": sampleJobs.filter(j => !j.location.includes("Dhaka") && j.location !== "Remote").length,
    });
    
    return { success: true, count: sampleJobs.length };
  } catch (error) {
    console.error("❌ Error seeding jobs:", error);
    return { success: false, error: error.message };
  }
};

// Export sample data for reference
export { sampleJobs };

// Instructions to run:
/*
1. Create a temporary component or page
2. Import this file
3. Add a button that calls seedJobs()
4. Example:

import { seedJobs } from './path/to/seedJobs';

function AdminPanel() {
  const handleSeed = async () => {
    const result = await seedJobs(false); // Set true to clear existing jobs first
    if (result.success) {
      alert(`Seeded ${result.count} jobs successfully!`);
    } else {
      alert(`Error: ${result.error}`);
    }
  };
  
  return <button onClick={handleSeed}>Seed Jobs</button>;
}

OR run in browser console:
import('./path/to/seedJobs').then(module => module.seedJobs());
*/
