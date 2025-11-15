import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

// Get SDG 8 Impact Analytics
export const getSDG8Analytics = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const analytics = {
      totalUsers: 0,
      usersWithSkills: 0,
      usersWithJobs: 0,
      totalSkills: [],
      skillGaps: [],
      commonDesiredSkills: [],
      jobApplications: 0,
      completedRoadmaps: 0,
      activeUsers: 0,
      locationDistribution: {},
      skillDemand: {},
      experienceLevels: {
        entry: 0,
        mid: 0,
        senior: 0,
      },
    };

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      analytics.totalUsers++;

      // Skills analysis
      if (userData.skills && userData.skills.length > 0) {
        analytics.usersWithSkills++;
        userData.skills.forEach(skill => {
          analytics.totalSkills.push(skill);
          analytics.skillDemand[skill] = (analytics.skillDemand[skill] || 0) + 1;
        });
      }

      // Desired skills (skill gaps)
      if (userData.basic?.DesiredSkill && Array.isArray(userData.basic.DesiredSkill)) {
        userData.basic.DesiredSkill.forEach(skill => {
          analytics.commonDesiredSkills.push(skill);
        });
      }

      // Location distribution
      if (userData.basic?.location) {
        const location = userData.basic.location;
        analytics.locationDistribution[location] = (analytics.locationDistribution[location] || 0) + 1;
      }

      // Experience level
      const exp = userData.basic?.exp || '';
      if (exp.includes('0') || exp.includes('1') || exp.toLowerCase().includes('entry')) {
        analytics.experienceLevels.entry++;
      } else if (exp.includes('5') || exp.includes('6') || exp.includes('7') || exp.toLowerCase().includes('senior')) {
        analytics.experienceLevels.senior++;
      } else if (exp) {
        analytics.experienceLevels.mid++;
      }
    });

    // Calculate top skills in demand
    const sortedSkills = Object.entries(analytics.skillDemand)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Calculate most desired skills (skill gaps)
    const desiredSkillCount = {};
    analytics.commonDesiredSkills.forEach(skill => {
      desiredSkillCount[skill] = (desiredSkillCount[skill] || 0) + 1;
    });
    const topDesiredSkills = Object.entries(desiredSkillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      ...analytics,
      topSkills: sortedSkills,
      topDesiredSkills: topDesiredSkills,
      skillGapAnalysis: topDesiredSkills,
      engagementRate: analytics.totalUsers > 0 
        ? ((analytics.usersWithSkills / analytics.totalUsers) * 100).toFixed(1)
        : 0,
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
};

// Get Job Analytics
export const getJobAnalytics = async () => {
  try {
    const jobsRef = collection(db, 'jobs');
    const jobsSnapshot = await getDocs(jobsRef);
    
    const analytics = {
      totalJobs: 0,
      jobsByCategory: {},
      jobsByLocation: {},
      jobsByType: {},
      recentJobs: [],
    };

    const jobs = [];
    jobsSnapshot.forEach((doc) => {
      const jobData = { id: doc.id, ...doc.data() };
      jobs.push(jobData);
      analytics.totalJobs++;

      // Category distribution
      const category = jobData.category || 'Other';
      analytics.jobsByCategory[category] = (analytics.jobsByCategory[category] || 0) + 1;

      // Location distribution
      const location = jobData.location || 'Not specified';
      analytics.jobsByLocation[location] = (analytics.jobsByLocation[location] || 0) + 1;

      // Job type distribution
      const type = jobData.type || 'Full-time';
      analytics.jobsByType[type] = (analytics.jobsByType[type] || 0) + 1;
    });

    // Get recent jobs
    analytics.recentJobs = jobs
      .sort((a, b) => (b.postedDate || 0) - (a.postedDate || 0))
      .slice(0, 5);

    return analytics;
  } catch (error) {
    console.error('Error getting job analytics:', error);
    throw error;
  }
};

// Get Learning Resources Analytics
export const getResourceAnalytics = async () => {
  try {
    // This would track course enrollments, completions, etc.
    // For now, returning mock structure that can be populated
    return {
      totalCourses: 0,
      enrollments: 0,
      completions: 0,
      popularCourses: [],
      coursesByCategory: {},
    };
  } catch (error) {
    console.error('Error getting resource analytics:', error);
    throw error;
  }
};

// Get Growth Trends (last 30 days)
export const getGrowthTrends = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const dailySignups = {};
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.createdAt) {
        const date = userData.createdAt.toDate();
        if (date >= thirtyDaysAgo) {
          const dateKey = date.toISOString().split('T')[0];
          dailySignups[dateKey] = (dailySignups[dateKey] || 0) + 1;
        }
      }
    });

    return {
      dailySignups,
      totalNewUsers: Object.values(dailySignups).reduce((a, b) => a + b, 0),
    };
  } catch (error) {
    console.error('Error getting growth trends:', error);
    return { dailySignups: {}, totalNewUsers: 0 };
  }
};

// Bangladesh specific data
export const getBangladeshJobMarketData = () => {
  return {
    topIndustries: [
      { name: 'IT/Software', growth: '+25%', demand: 'High' },
      { name: 'Garments/Textile', growth: '+8%', demand: 'Medium' },
      { name: 'Banking/Finance', growth: '+12%', demand: 'High' },
      { name: 'E-commerce', growth: '+35%', demand: 'Very High' },
      { name: 'Education/EdTech', growth: '+20%', demand: 'High' },
    ],
    inDemandSkills: [
      'JavaScript/React',
      'Python/Django',
      'Digital Marketing',
      'Data Analysis',
      'Mobile App Development',
      'Cloud Computing (AWS)',
      'UI/UX Design',
      'Content Writing',
    ],
    governmentInitiatives: [
      {
        name: 'Learning and Earning Development Project (LEDP)',
        url: 'https://seip.gov.bd/',
        description: 'Skills training and employment services',
      },
      {
        name: 'National Skills Development Policy',
        url: 'https://www.ilo.org/dhaka',
        description: 'ILO supported skills development',
      },
      {
        name: 'Bangladesh Computer Council',
        url: 'https://bcc.gov.bd/',
        description: 'IT training and certification',
      },
    ],
    regionalOpportunities: {
      'Dhaka': { jobs: 'High', industries: ['IT', 'Finance', 'E-commerce'] },
      'Chittagong': { jobs: 'Medium', industries: ['Port', 'Trade', 'Manufacturing'] },
      'Sylhet': { jobs: 'Growing', industries: ['Tourism', 'Tea', 'IT'] },
      'Rajshahi': { jobs: 'Medium', industries: ['Agriculture', 'Education', 'Silk'] },
    },
  };
};
