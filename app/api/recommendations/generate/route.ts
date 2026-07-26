import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface LearningPreferences {
  topic: string
  currentLevel: string
  timeAvailable: string
  learningGoal: string
  preferredFormat: string[]
  timeline: string
  specificSkills: string
  priorExperience: string
}

interface RoadmapStep {
  id: string
  title: string
  description: string
  estimatedTime: string
  difficulty: string
  prerequisites: string[]
  resources: string[]
}

interface CourseRecommendation {
  id: string
  title: string
  description: string
  instructor: string
  level: string
  duration: string
  rating: number
  enrollments: number
  price: number
  matchScore: number
  isAvailable: boolean
}

// Groq API configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Smart roadmap generation with Groq AI capability
async function generateRoadmapSteps(preferences: LearningPreferences): Promise<RoadmapStep[]> {
  // Check if Groq API is available
  if (GROQ_API_KEY) {
    try {
      return await generateAIRoadmap(preferences)
    } catch (error) {
      console.error('Error generating AI roadmap:', error)
      // Fall back to intelligent template-based generation
    }
  }

  // Use intelligent template-based generation
  return generateIntelligentRoadmap(preferences)
}

// AI-powered roadmap generation using Groq
async function generateAIRoadmap(preferences: LearningPreferences): Promise<RoadmapStep[]> {
  const prompt = `
Create a personalized learning roadmap for someone who wants to learn "${preferences.topic}".

Student Profile:
- Current Level: ${preferences.currentLevel}
- Time Available: ${preferences.timeAvailable} per week
- Learning Goal: ${preferences.learningGoal}
- Timeline: ${preferences.timeline}
- Preferred Formats: ${preferences.preferredFormat.join(', ')}
- Specific Skills: ${preferences.specificSkills}
- Prior Experience: ${preferences.priorExperience}

Please create a structured learning roadmap with 4-8 steps. For each step, provide:
1. A clear, actionable title
2. A detailed description (2-3 sentences)
3. Estimated time to complete (in weeks)
4. Difficulty level (Beginner/Intermediate/Advanced)
5. Prerequisites (list of previous steps or external knowledge needed)
6. Key resources or activities (3-5 items)

Format the response as a JSON array of objects with this structure:
{
  "id": "step_number",
  "title": "Step Title",
  "description": "Detailed description of what the student will learn and accomplish",
  "estimatedTime": "X-Y weeks",
  "difficulty": "Beginner|Intermediate|Advanced",
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "resources": ["resource1", "resource2", "resource3"]
}

Make sure the roadmap is:
- Logically sequenced from basics to advanced
- Realistic for the given time commitment
- Tailored to their specific goals and experience level
- Includes practical, hands-on learning opportunities

Respond with ONLY the JSON array, no additional text.`

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant', // Fast and capable Groq model
      messages: [
        {
          role: 'system',
          content: 'You are an expert learning advisor who creates personalized educational roadmaps. Always respond with valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`)
  }

  const data = await response.json()
  const aiResponse = data.choices[0]?.message?.content

  if (!aiResponse) {
    throw new Error('No response from Groq AI')
  }

  try {
    // Parse the JSON response
    const roadmapSteps = JSON.parse(aiResponse)
    
    // Validate and ensure proper structure
    return roadmapSteps.map((step: any, index: number) => ({
      id: step.id || `${index + 1}`,
      title: step.title || `Step ${index + 1}`,
      description: step.description || 'Learning step description',
      estimatedTime: step.estimatedTime || '2-3 weeks',
      difficulty: step.difficulty || 'Intermediate',
      prerequisites: Array.isArray(step.prerequisites) ? step.prerequisites : [],
      resources: Array.isArray(step.resources) ? step.resources : []
    }))
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError)
    throw new Error('Invalid AI response format')
  }
}

// Intelligent template-based roadmap generation
function generateIntelligentRoadmap(preferences: LearningPreferences): RoadmapStep[] {
  const { topic, currentLevel, timeAvailable } = preferences
  const topicLower = topic.toLowerCase()

  // Determine weekly hours for pacing
  const weeklyHours = getWeeklyHours(timeAvailable)

  // Generate topic-specific roadmaps
  if (topicLower.includes('web development') || topicLower.includes('web dev')) {
    return generateWebDevRoadmap(currentLevel, weeklyHours, preferences)
  } else if (topicLower.includes('data science') || topicLower.includes('data')) {
    return generateDataScienceRoadmap(currentLevel, weeklyHours, preferences)
  } else if (topicLower.includes('machine learning') || topicLower.includes('ml') || topicLower.includes('ai')) {
    return generateMLRoadmap(currentLevel, weeklyHours, preferences)
  } else if (topicLower.includes('marketing') || topicLower.includes('digital marketing')) {
    return generateMarketingRoadmap(currentLevel, weeklyHours, preferences)
  } else if (topicLower.includes('python')) {
    return generatePythonRoadmap(currentLevel, weeklyHours, preferences)
  } else if (topicLower.includes('javascript') || topicLower.includes('js')) {
    return generateJavaScriptRoadmap(currentLevel, weeklyHours, preferences)
  } else {
    return generateAdaptiveRoadmap(preferences)
  }
}

function getWeeklyHours(timeAvailable: string): number {
  switch(timeAvailable) {
    case '1-3-hours': return 2
    case '4-7-hours': return 5
    case '8-15-hours': return 10
    case '15-plus-hours': return 20
    default: return 5
  }
}
// Fallback roadmap generation if AI fails
function generateFallbackRoadmap(preferences: LearningPreferences): RoadmapStep[] {
  const { topic, currentLevel } = preferences

  return [
    {
      id: '1',
      title: `${topic} Fundamentals`,
      description: `Start with the core concepts and basic principles of ${topic}. Build a solid foundation through introductory materials and hands-on practice.`,
      estimatedTime: '3-4 weeks',
      difficulty: currentLevel === 'complete-beginner' ? 'Beginner' : 'Intermediate',
      prerequisites: [],
      resources: ['Online courses', 'Documentation', 'Practice exercises', 'Community forums']
    },
    {
      id: '2',
      title: `Practical ${topic} Skills`,
      description: `Apply your knowledge through real-world projects and practical exercises. Focus on building tangible skills and portfolio pieces.`,
      estimatedTime: '4-6 weeks',
      difficulty: 'Intermediate',
      prerequisites: ['Fundamentals'],
      resources: ['Project tutorials', 'Hands-on labs', 'Code repositories', 'Peer collaboration']
    },
    {
      id: '3',
      title: `Advanced ${topic} Concepts`,
      description: `Dive deeper into advanced topics and industry best practices. Learn optimization, scaling, and professional development workflows.`,
      estimatedTime: '4-8 weeks',
      difficulty: 'Advanced',
      prerequisites: ['Practical Skills'],
      resources: ['Advanced courses', 'Industry case studies', 'Open source contributions', 'Mentorship']
    }
  ]
}

function generateWebDevRoadmap(level: string, weeklyHours: number, preferences: LearningPreferences): RoadmapStep[] {
  const isBeginnerLevel = level === 'complete-beginner' || level === 'some-basics'
  const timeMultiplier = weeklyHours < 5 ? 1.5 : weeklyHours > 10 ? 0.7 : 1

  if (isBeginnerLevel) {
    return [
      {
        id: '1',
        title: 'HTML & CSS Fundamentals',
        description: 'Master the building blocks of web pages. Learn semantic HTML structure, CSS styling, layouts with Flexbox and Grid, and responsive design principles.',
        estimatedTime: `${Math.ceil(2 * timeMultiplier)}-${Math.ceil(3 * timeMultiplier)} weeks`,
        difficulty: 'Beginner',
        prerequisites: [],
        resources: ['Interactive HTML/CSS tutorials', 'Build 3 static websites', 'MDN Web Docs', 'CSS Grid and Flexbox games']
      },
      {
        id: '2',
        title: 'JavaScript Programming Fundamentals',
        description: 'Learn JavaScript syntax, data types, functions, and DOM manipulation. Build interactive web features and understand event handling.',
        estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
        difficulty: 'Beginner',
        prerequisites: ['HTML & CSS Fundamentals'],
        resources: ['JavaScript course with projects', 'Build calculator and todo apps', 'JavaScript30 challenge', 'Browser DevTools practice']
      },
      {
        id: '3',
        title: 'Modern Frontend Development',
        description: 'Learn modern JavaScript (ES6+), package managers (npm), build tools, and version control with Git. Understand modern development workflow.',
        estimatedTime: `${Math.ceil(2 * timeMultiplier)}-${Math.ceil(3 * timeMultiplier)} weeks`,
        difficulty: 'Intermediate',
        prerequisites: ['JavaScript Programming Fundamentals'],
        resources: ['Git and GitHub mastery', 'ES6+ features deep dive', 'Webpack/Vite basics', 'NPM package management']
      },
      {
        id: '4',
        title: 'React.js Framework',
        description: 'Build dynamic user interfaces with React. Learn components, state management, hooks, and modern React patterns for scalable applications.',
        estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(6 * timeMultiplier)} weeks`,
        difficulty: 'Intermediate',
        prerequisites: ['Modern Frontend Development'],
        resources: ['React official tutorial', 'Build 2-3 React projects', 'State management (Context/Redux)', 'React Router for navigation']
      },
      {
        id: '5',
        title: 'Backend Development with Node.js',
        description: 'Learn server-side JavaScript with Node.js and Express. Build REST APIs, handle databases, and implement authentication systems.',
        estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(5 * timeMultiplier)} weeks`,
        difficulty: 'Intermediate',
        prerequisites: ['JavaScript Programming Fundamentals'],
        resources: ['Node.js and Express course', 'Database integration (MongoDB/PostgreSQL)', 'API development', 'Authentication with JWT']
      },
      {
        id: '6',
        title: 'Full-Stack Project & Deployment',
        description: 'Combine frontend and backend skills to build a complete web application. Learn deployment, testing, and production best practices.',
        estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['React.js Framework', 'Backend Development with Node.js'],
        resources: ['Full-stack project tutorial', 'Cloud deployment (Vercel/Netlify)', 'Testing frameworks', 'Performance optimization']
      }
    ]
  } else {
    // Advanced path for experienced developers
    return [
      {
        id: '1',
        title: 'Modern JavaScript & TypeScript',
        description: 'Master advanced JavaScript patterns, async programming, and TypeScript for type-safe development. Learn performance optimization techniques.',
        estimatedTime: `${Math.ceil(2 * timeMultiplier)}-${Math.ceil(3 * timeMultiplier)} weeks`,
        difficulty: 'Intermediate',
        prerequisites: ['Basic JavaScript knowledge'],
        resources: ['TypeScript deep dive', 'Advanced async patterns', 'Performance profiling', 'Modern JS features']
      },
      {
        id: '2',
        title: 'Advanced React & State Management',
        description: 'Learn advanced React patterns, performance optimization, testing strategies, and complex state management with Redux Toolkit or Zustand.',
        estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['React basics'],
        resources: ['Advanced React patterns', 'Redux Toolkit mastery', 'React Testing Library', 'Performance optimization']
      },
      {
        id: '3',
        title: 'Full-Stack Architecture & DevOps',
        description: 'Design scalable applications with microservices, implement CI/CD pipelines, and learn cloud deployment strategies.',
        estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(5 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['Backend experience'],
        resources: ['System design principles', 'Docker containerization', 'CI/CD with GitHub Actions', 'AWS/Azure deployment']
      }
    ]
  }
}

function generateDataScienceRoadmap(level: string, weeklyHours: number, preferences: LearningPreferences): RoadmapStep[] {
  const timeMultiplier = weeklyHours < 5 ? 1.5 : weeklyHours > 10 ? 0.7 : 1
  const isBeginnerLevel = level === 'complete-beginner' || level === 'some-basics'

  if (isBeginnerLevel) {
    return [
      {
        id: '1',
        title: 'Python Programming for Data Science',
        description: 'Master Python fundamentals with focus on data science applications. Learn syntax, data structures, functions, and object-oriented programming concepts.',
        estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
        difficulty: 'Beginner',
        prerequisites: [],
        resources: ['Python for Data Science course', 'Jupyter Notebook setup', 'Python coding challenges', 'Data science Python libraries overview']
      },
      {
        id: '2',
        title: 'Data Manipulation with Pandas & NumPy',
        description: 'Learn to clean, transform, and analyze data using Pandas and NumPy. Master data loading, filtering, grouping, and statistical operations.',
        estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
        difficulty: 'Intermediate',
        prerequisites: ['Python Programming for Data Science'],
        resources: ['Pandas comprehensive tutorial', 'Real dataset practice', 'NumPy array operations', 'Data cleaning projects']
      },
      {
        id: '3',
        title: 'Data Visualization & Storytelling',
        description: 'Create compelling visualizations using Matplotlib, Seaborn, and Plotly. Learn to tell stories with data and create interactive dashboards.',
        estimatedTime: `${Math.ceil(2 * timeMultiplier)}-${Math.ceil(3 * timeMultiplier)} weeks`,
        difficulty: 'Intermediate',
        prerequisites: ['Data Manipulation with Pandas & NumPy'],
        resources: ['Visualization libraries mastery', 'Dashboard creation with Plotly', 'Data storytelling principles', 'Portfolio visualization projects']
      },
      {
        id: '4',
        title: 'Statistics & Probability for Data Science',
        description: 'Understand statistical concepts, hypothesis testing, and probability distributions essential for data analysis and machine learning.',
        estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(5 * timeMultiplier)} weeks`,
        difficulty: 'Intermediate',
        prerequisites: ['Data Manipulation with Pandas & NumPy'],
        resources: ['Statistics for Data Science course', 'Hypothesis testing practice', 'Probability distributions', 'Statistical analysis projects']
      },
      {
        id: '5',
        title: 'Machine Learning Fundamentals',
        description: 'Learn supervised and unsupervised learning algorithms, model evaluation, and feature engineering using scikit-learn.',
        estimatedTime: `${Math.ceil(5 * timeMultiplier)}-${Math.ceil(6 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['Statistics & Probability for Data Science'],
        resources: ['Machine Learning course', 'Scikit-learn projects', 'Model evaluation techniques', 'Feature engineering practices']
      },
      {
        id: '6',
        title: 'Data Science Portfolio Project',
        description: 'Apply all learned skills to complete an end-to-end data science project from data collection to model deployment.',
        estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['Machine Learning Fundamentals'],
        resources: ['End-to-end project tutorial', 'Model deployment options', 'Portfolio presentation', 'Industry best practices']
      }
    ]
  } else {
    return [
      {
        id: '1',
        title: 'Advanced Python & Data Engineering',
        description: 'Master advanced Python concepts, data pipelines, and big data tools like Apache Spark for large-scale data processing.',
        estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['Python basics'],
        resources: ['Advanced Python patterns', 'Apache Spark tutorial', 'Data pipeline design', 'Big data processing']
      },
      {
        id: '2',
        title: 'Advanced Machine Learning & Deep Learning',
        description: 'Implement advanced ML algorithms, neural networks with TensorFlow/PyTorch, and learn MLOps practices.',
        estimatedTime: `${Math.ceil(5 * timeMultiplier)}-${Math.ceil(6 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['ML fundamentals'],
        resources: ['Deep learning frameworks', 'Neural network architectures', 'MLOps pipeline', 'Model optimization']
      },
      {
        id: '3',
        title: 'Specialized Data Science Applications',
        description: 'Focus on specialized areas like NLP, computer vision, or time series analysis based on your career goals.',
        estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(6 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['Advanced Machine Learning'],
        resources: ['Specialization courses', 'Industry case studies', 'Research papers', 'Advanced projects']
      }
    ]
  }
}

function generateMLRoadmap(level: string, weeklyHours: number, preferences: LearningPreferences): RoadmapStep[] {
  const timeMultiplier = weeklyHours < 5 ? 1.5 : weeklyHours > 10 ? 0.7 : 1

  return [
    {
      id: '1',
      title: 'Mathematics & Statistics Foundation',
      description: 'Master linear algebra, calculus, and statistics essential for understanding ML algorithms. Focus on practical applications in machine learning contexts.',
      estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(6 * timeMultiplier)} weeks`,
      difficulty: level === 'complete-beginner' ? 'Intermediate' : 'Beginner',
      prerequisites: [],
      resources: ['Linear algebra for ML', 'Statistics and probability', 'Calculus fundamentals', 'Mathematical notation guide']
    },
    {
      id: '2',
      title: 'Python Programming & ML Libraries',
      description: 'Learn Python programming with focus on data science libraries: NumPy, Pandas, Matplotlib, and scikit-learn for machine learning.',
      estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
      difficulty: 'Intermediate',
      prerequisites: ['Mathematics & Statistics Foundation'],
      resources: ['Python for ML course', 'Scikit-learn documentation', 'Hands-on coding exercises', 'Data preprocessing techniques']
    },
    {
      id: '3',
      title: 'Supervised Learning Algorithms',
      description: 'Implement and understand classification and regression algorithms. Learn model evaluation, cross-validation, and hyperparameter tuning.',
      estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(5 * timeMultiplier)} weeks`,
      difficulty: 'Advanced',
      prerequisites: ['Python Programming & ML Libraries'],
      resources: ['Algorithm implementations', 'Model evaluation techniques', 'Real-world datasets', 'Performance optimization']
    },
    {
      id: '4',
      title: 'Unsupervised Learning & Feature Engineering',
      description: 'Explore clustering, dimensionality reduction, and advanced feature engineering techniques for better model performance.',
      estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
      difficulty: 'Advanced',
      prerequisites: ['Supervised Learning Algorithms'],
      resources: ['Clustering algorithms', 'PCA and t-SNE', 'Feature selection methods', 'Unsupervised projects']
    },
    {
      id: '5',
      title: 'Deep Learning & Neural Networks',
      description: 'Introduction to neural networks, deep learning frameworks (TensorFlow/PyTorch), and building deep learning models.',
      estimatedTime: `${Math.ceil(5 * timeMultiplier)}-${Math.ceil(6 * timeMultiplier)} weeks`,
      difficulty: 'Advanced',
      prerequisites: ['Supervised Learning Algorithms'],
      resources: ['Deep learning frameworks', 'Neural network architectures', 'Computer vision basics', 'NLP fundamentals']
    },
    {
      id: '6',
      title: 'MLOps & Production Deployment',
      description: 'Learn to deploy ML models in production, implement MLOps practices, and build scalable ML systems.',
      estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
      difficulty: 'Advanced',
      prerequisites: ['Deep Learning & Neural Networks'],
      resources: ['Model deployment strategies', 'MLOps tools and practices', 'Cloud ML services', 'Production monitoring']
    }
  ]
}

function generateMarketingRoadmap(level: string, weeklyHours: number, preferences: LearningPreferences): RoadmapStep[] {
  const timeMultiplier = weeklyHours < 5 ? 1.5 : weeklyHours > 10 ? 0.7 : 1

  return [
    {
      id: '1',
      title: 'Digital Marketing Strategy & Fundamentals',
      description: 'Understand digital marketing ecosystem, customer journey mapping, and develop strategic thinking for effective marketing campaigns.',
      estimatedTime: `${Math.ceil(2 * timeMultiplier)}-${Math.ceil(3 * timeMultiplier)} weeks`,
      difficulty: 'Beginner',
      prerequisites: [],
      resources: ['Digital marketing strategy course', 'Customer persona development', 'Marketing funnel design', 'Industry case studies']
    },
    {
      id: '2',
      title: 'SEO & Content Marketing Mastery',
      description: 'Master search engine optimization, keyword research, content creation, and content marketing strategies that drive organic traffic.',
      estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
      difficulty: 'Intermediate',
      prerequisites: ['Digital Marketing Strategy & Fundamentals'],
      resources: ['SEO tools mastery', 'Content creation workflow', 'Keyword research techniques', 'Content calendar planning']
    },
    {
      id: '3',
      title: 'Social Media Marketing & Advertising',
      description: 'Create engaging social media campaigns, master platform-specific strategies, and run effective paid advertising campaigns.',
      estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
      difficulty: 'Intermediate',
      prerequisites: ['Digital Marketing Strategy & Fundamentals'],
      resources: ['Social media platform guides', 'Ad campaign creation', 'Community management', 'Influencer marketing']
    },
    {
      id: '4',
      title: 'Email Marketing & Marketing Automation',
      description: 'Build effective email campaigns, implement marketing automation workflows, and nurture leads through personalized communication.',
      estimatedTime: `${Math.ceil(2 * timeMultiplier)}-${Math.ceil(3 * timeMultiplier)} weeks`,
      difficulty: 'Intermediate',
      prerequisites: ['Digital Marketing Strategy & Fundamentals'],
      resources: ['Email marketing platforms', 'Automation workflows', 'A/B testing strategies', 'Lead nurturing campaigns']
    },
    {
      id: '5',
      title: 'Analytics, Data Analysis & Performance Optimization',
      description: 'Master Google Analytics, track KPIs, analyze campaign performance, and optimize marketing efforts based on data insights.',
      estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
      difficulty: 'Advanced',
      prerequisites: ['SEO & Content Marketing Mastery', 'Social Media Marketing & Advertising'],
      resources: ['Google Analytics certification', 'Data visualization tools', 'ROI calculation methods', 'Performance reporting']
    }
  ]
}

function generatePythonRoadmap(level: string, weeklyHours: number, preferences: LearningPreferences): RoadmapStep[] {
  const timeMultiplier = weeklyHours < 5 ? 1.5 : weeklyHours > 10 ? 0.7 : 1
  const isBeginnerLevel = level === 'complete-beginner' || level === 'some-basics'

  if (isBeginnerLevel) {
    return [
      {
        id: '1',
        title: 'Python Fundamentals & Syntax',
        description: 'Learn Python basics including variables, data types, control structures, functions, and object-oriented programming concepts.',
        estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
        difficulty: 'Beginner',
        prerequisites: [],
        resources: ['Python tutorial', 'Interactive coding exercises', 'Python documentation', 'Basic projects']
      },
      {
        id: '2',
        title: 'Data Structures & Algorithms in Python',
        description: 'Master Python data structures (lists, dictionaries, sets) and implement common algorithms to solve programming problems.',
        estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
        difficulty: 'Intermediate',
        prerequisites: ['Python Fundamentals & Syntax'],
        resources: ['Algorithm practice', 'LeetCode problems', 'Data structure implementations', 'Problem-solving strategies']
      },
      {
        id: '3',
        title: 'Python Libraries & Frameworks',
        description: 'Explore popular Python libraries for your chosen specialization (web development, data science, automation, etc.).',
        estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(5 * timeMultiplier)} weeks`,
        difficulty: 'Intermediate',
        prerequisites: ['Data Structures & Algorithms in Python'],
        resources: ['Library documentation', 'Framework tutorials', 'Hands-on projects', 'Best practices guide']
      },
      {
        id: '4',
        title: 'Advanced Python & Project Development',
        description: 'Learn advanced Python concepts, testing, debugging, and build a comprehensive project showcasing your skills.',
        estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(6 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['Python Libraries & Frameworks'],
        resources: ['Advanced Python patterns', 'Testing frameworks', 'Project development', 'Code optimization']
      }
    ]
  } else {
    return [
      {
        id: '1',
        title: 'Advanced Python Programming',
        description: 'Master advanced Python concepts including decorators, context managers, metaclasses, and asynchronous programming.',
        estimatedTime: `${Math.ceil(2 * timeMultiplier)}-${Math.ceil(3 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['Python basics'],
        resources: ['Advanced Python course', 'Async programming', 'Design patterns', 'Performance optimization']
      },
      {
        id: '2',
        title: 'Specialized Python Applications',
        description: 'Focus on your area of interest: web development (Django/Flask), data science (pandas/numpy), or automation/scripting.',
        estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(6 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['Advanced Python Programming'],
        resources: ['Specialized frameworks', 'Industry projects', 'Best practices', 'Production deployment']
      }
    ]
  }
}

function generateJavaScriptRoadmap(level: string, weeklyHours: number, preferences: LearningPreferences): RoadmapStep[] {
  const timeMultiplier = weeklyHours < 5 ? 1.5 : weeklyHours > 10 ? 0.7 : 1
  const isBeginnerLevel = level === 'complete-beginner' || level === 'some-basics'

  if (isBeginnerLevel) {
    return [
      {
        id: '1',
        title: 'JavaScript Fundamentals',
        description: 'Learn JavaScript syntax, variables, functions, objects, arrays, and control flow. Understand how JavaScript works in the browser.',
        estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
        difficulty: 'Beginner',
        prerequisites: ['Basic HTML/CSS knowledge helpful'],
        resources: ['JavaScript tutorial', 'Browser console practice', 'Interactive exercises', 'Small projects']
      },
      {
        id: '2',
        title: 'DOM Manipulation & Events',
        description: 'Learn to interact with web pages dynamically, handle user events, and create interactive web applications.',
        estimatedTime: `${Math.ceil(2 * timeMultiplier)}-${Math.ceil(3 * timeMultiplier)} weeks`,
        difficulty: 'Intermediate',
        prerequisites: ['JavaScript Fundamentals'],
        resources: ['DOM manipulation guide', 'Event handling practice', 'Interactive web projects', 'Browser APIs']
      },
      {
        id: '3',
        title: 'Modern JavaScript (ES6+)',
        description: 'Master modern JavaScript features including arrow functions, promises, async/await, modules, and destructuring.',
        estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
        difficulty: 'Intermediate',
        prerequisites: ['DOM Manipulation & Events'],
        resources: ['ES6+ features guide', 'Async programming', 'Module systems', 'Modern development tools']
      },
      {
        id: '4',
        title: 'JavaScript Frameworks & Tools',
        description: 'Learn a popular framework (React, Vue, or Angular) and modern development tools like npm, webpack, and version control.',
        estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(6 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['Modern JavaScript (ES6+)'],
        resources: ['Framework documentation', 'Build tools setup', 'Package management', 'Development workflow']
      }
    ]
  } else {
    return [
      {
        id: '1',
        title: 'Advanced JavaScript Concepts',
        description: 'Master closures, prototypes, this binding, advanced async patterns, and JavaScript engine internals.',
        estimatedTime: `${Math.ceil(2 * timeMultiplier)}-${Math.ceil(3 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['JavaScript fundamentals'],
        resources: ['Advanced JS concepts', 'Performance optimization', 'Memory management', 'Design patterns']
      },
      {
        id: '2',
        title: 'Full-Stack JavaScript Development',
        description: 'Build complete applications using Node.js for backend and modern frontend frameworks with advanced state management.',
        estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(6 * timeMultiplier)} weeks`,
        difficulty: 'Advanced',
        prerequisites: ['Advanced JavaScript Concepts'],
        resources: ['Node.js mastery', 'Advanced React/Vue', 'Database integration', 'Production deployment']
      }
    ]
  }
}

function generateAdaptiveRoadmap(preferences: LearningPreferences): RoadmapStep[] {
  const { topic, currentLevel, timeAvailable } = preferences
  const weeklyHours = getWeeklyHours(timeAvailable)
  const timeMultiplier = weeklyHours < 5 ? 1.5 : weeklyHours > 10 ? 0.7 : 1

  return [
    {
      id: '1',
      title: `${topic} Fundamentals & Core Concepts`,
      description: `Build a strong foundation in ${topic} by learning essential concepts, terminology, and basic principles. Focus on understanding the fundamentals before moving to advanced topics.`,
      estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
      difficulty: currentLevel === 'complete-beginner' ? 'Beginner' : 'Intermediate',
      prerequisites: [],
      resources: ['Introductory course or tutorial', 'Official documentation', 'Community forums', 'Basic practice exercises']
    },
    {
      id: '2',
      title: `Practical ${topic} Skills Development`,
      description: `Apply your foundational knowledge through hands-on practice and real-world projects. Focus on building practical skills that you can use immediately.`,
      estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(6 * timeMultiplier)} weeks`,
      difficulty: 'Intermediate',
      prerequisites: [`${topic} Fundamentals & Core Concepts`],
      resources: ['Hands-on tutorials', 'Practice projects', 'Online labs or sandboxes', 'Peer collaboration']
    },
    {
      id: '3',
      title: `Advanced ${topic} Techniques & Best Practices`,
      description: `Dive deeper into advanced concepts, learn industry best practices, and understand how to optimize and scale your ${topic} skills for professional use.`,
      estimatedTime: `${Math.ceil(4 * timeMultiplier)}-${Math.ceil(8 * timeMultiplier)} weeks`,
      difficulty: 'Advanced',
      prerequisites: [`Practical ${topic} Skills Development`],
      resources: ['Advanced courses', 'Industry case studies', 'Expert-led workshops', 'Professional certifications']
    },
    {
      id: '4',
      title: `${topic} Portfolio & Real-World Application`,
      description: `Create a comprehensive portfolio showcasing your ${topic} skills through real-world projects. Focus on demonstrating your expertise to potential employers or clients.`,
      estimatedTime: `${Math.ceil(3 * timeMultiplier)}-${Math.ceil(4 * timeMultiplier)} weeks`,
      difficulty: 'Advanced',
      prerequisites: [`Advanced ${topic} Techniques & Best Practices`],
      resources: ['Portfolio development guide', 'Project showcase platforms', 'Networking opportunities', 'Career guidance resources']
    }
  ]
}



async function findMatchingCourses(preferences: LearningPreferences): Promise<CourseRecommendation[]> {
  try {
    // Get all published courses with enrollment counts and lessons
    const courses = await prisma.course.findMany({
      where: {
        status: 'published'
      },
      include: {
        createdBy: {
          select: {
            name: true
          }
        },
        lessons: {
          select: {
            id: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    if (courses.length === 0) {
      return []
    }

    // Use AI to analyze and match courses
    const courseAnalysis = await analyzeCourseRelevance(courses, preferences)

    const recommendations: CourseRecommendation[] = courses.map((course, index) => {
      const analysis = courseAnalysis[index] || { matchScore: 0, level: 'All Levels', reasoning: '' }

      // Calculate estimated duration based on lessons
      const lessonCount = course.lessons.length
      const estimatedHours = Math.max(lessonCount * 0.5, 2) // Minimum 2 hours
      const duration = estimatedHours < 10 ? `${Math.ceil(estimatedHours)} hours` : `${Math.ceil(estimatedHours / 8)} weeks`

      // Calculate rating based on enrollments (mock but realistic)
      const enrollmentCount = course._count.enrollments
      let rating = 4.0
      if (enrollmentCount > 100) rating = 4.7
      else if (enrollmentCount > 50) rating = 4.5
      else if (enrollmentCount > 20) rating = 4.3
      else if (enrollmentCount > 5) rating = 4.1

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        instructor: course.createdBy.name || 'Unknown Instructor',
        level: analysis.level,
        duration: duration,
        rating: Math.round(rating * 10) / 10,
        enrollments: enrollmentCount,
        price: Number(course.price),
        matchScore: Math.min(100, Math.max(0, analysis.matchScore)),
        isAvailable: true
      }
    })

    // Sort by match score and return top matches
    return recommendations
      .filter(rec => rec.matchScore > 20) // Only return courses with decent match
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8)
  } catch (error) {
    console.error('Error finding matching courses:', error)
    return []
  }
}

async function analyzeCourseRelevance(courses: any[], preferences: LearningPreferences) {
  // Check if Groq API is available for advanced analysis
  if (GROQ_API_KEY) {
    try {
      return await performAICourseAnalysis(courses, preferences)
    } catch (error) {
      console.error('Error in AI course analysis:', error)
      // Fall back to smart keyword matching
    }
  }

  // Smart keyword-based matching with enhanced scoring
  return performSmartCourseMatching(courses, preferences)
}

async function performAICourseAnalysis(courses: any[], preferences: LearningPreferences) {
  const courseSummaries = courses.map(course => ({
    title: course.title,
    description: course.description.substring(0, 200), // Limit description length
    enrollments: course._count.enrollments
  }))

  const prompt = `
Analyze how well each course matches the student's learning preferences and assign a match score (0-100).

Student Preferences:
- Topic: ${preferences.topic}
- Current Level: ${preferences.currentLevel}
- Learning Goal: ${preferences.learningGoal}
- Specific Skills: ${preferences.specificSkills}
- Prior Experience: ${preferences.priorExperience}

Courses to analyze:
${courseSummaries.map((course, i) => `${i + 1}. "${course.title}" - ${course.description}`).join('\n')}

For each course, provide:
1. Match score (0-100) based on relevance to the student's topic and goals
2. Appropriate difficulty level (Beginner/Intermediate/Advanced) based on course content and student level
3. Brief reasoning for the score

Respond with a JSON array in this format:
[
  {
    "matchScore": 85,
    "level": "Beginner",
    "reasoning": "Highly relevant to web development goals"
  }
]

Consider:
- Topic relevance (most important)
- Difficulty appropriateness for student level
- Alignment with learning goals
- Course popularity (higher enrollments = slight boost)

Respond with ONLY the JSON array, no additional text.`

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are an expert course recommendation system. Analyze courses objectively and provide accurate match scores. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`)
  }

  const data = await response.json()
  const aiResponse = data.choices[0]?.message?.content

  if (!aiResponse) {
    throw new Error('No response from Groq AI course analysis')
  }

  return JSON.parse(aiResponse)
}

function performSmartCourseMatching(courses: any[], preferences: LearningPreferences) {
  const topicKeywords = extractKeywords(preferences.topic)
  const skillKeywords = extractKeywords(preferences.specificSkills)
  const allKeywords = [...topicKeywords, ...skillKeywords]

  return courses.map(course => {
    const courseTitle = course.title.toLowerCase()
    const courseDesc = course.description.toLowerCase()

    let matchScore = 0

    // Primary topic matching (highest weight)
    topicKeywords.forEach(keyword => {
      if (courseTitle.includes(keyword)) matchScore += 35
      if (courseDesc.includes(keyword)) matchScore += 15
    })

    // Specific skills matching
    skillKeywords.forEach(keyword => {
      if (courseTitle.includes(keyword)) matchScore += 25
      if (courseDesc.includes(keyword)) matchScore += 10
    })

    // Learning goal alignment
    const goalKeywords = extractGoalKeywords(preferences.learningGoal)
    goalKeywords.forEach(keyword => {
      if (courseTitle.includes(keyword) || courseDesc.includes(keyword)) {
        matchScore += 15
      }
    })

    // Popularity boost (but not too much)
    const enrollments = course._count.enrollments
    if (enrollments > 100) matchScore += 8
    else if (enrollments > 50) matchScore += 5
    else if (enrollments > 20) matchScore += 3

    // Determine appropriate level
    const level = determineCourseLevel(course, preferences.currentLevel)

    return {
      matchScore: Math.min(100, Math.max(0, matchScore)),
      level,
      reasoning: `Matched ${allKeywords.filter(k =>
        courseTitle.includes(k) || courseDesc.includes(k)
      ).length} keywords`
    }
  })
}

function extractKeywords(text: string): string[] {
  if (!text) return []

  return text.toLowerCase()
    .split(/[,\s]+/)
    .map(word => word.trim())
    .filter(word => word.length > 2)
    .filter(word => !['and', 'the', 'for', 'with', 'from', 'into'].includes(word))
}

function extractGoalKeywords(goal: string): string[] {
  const goalMappings: Record<string, string[]> = {
    'career-change': ['career', 'job', 'professional', 'industry'],
    'skill-upgrade': ['advanced', 'professional', 'expert', 'mastery'],
    'personal-interest': ['beginner', 'introduction', 'basics', 'fundamentals'],
    'academic-requirement': ['course', 'study', 'academic', 'university'],
    'freelancing': ['freelance', 'client', 'project', 'portfolio'],
    'business': ['business', 'entrepreneur', 'startup', 'management']
  }

  return goalMappings[goal] || []
}

function determineCourseLevel(course: any, studentLevel: string): string {
  const title = course.title.toLowerCase()
  const description = course.description.toLowerCase()

  // Check for explicit level indicators
  if (title.includes('beginner') || title.includes('intro') || title.includes('basics')) {
    return 'Beginner'
  }
  if (title.includes('advanced') || title.includes('expert') || title.includes('master')) {
    return 'Advanced'
  }
  if (title.includes('intermediate') || description.includes('intermediate')) {
    return 'Intermediate'
  }

  // Infer from student level
  if (studentLevel === 'complete-beginner') {
    return 'Beginner'
  } else if (studentLevel === 'advanced') {
    return 'Advanced'
  }

  return 'All Levels'
}

async function generateAlternativeSuggestions(preferences: LearningPreferences): Promise<string[]> {
  // Check if Groq API is available for personalized suggestions
  if (GROQ_API_KEY) {
    try {
      return await generateAISuggestions(preferences)
    } catch (error) {
      console.error('Error generating AI suggestions:', error)
      // Fall back to smart template-based suggestions
    }
  }

  // Generate smart, topic-specific suggestions
  return generateSmartSuggestions(preferences)
}

async function generateAISuggestions(preferences: LearningPreferences): Promise<string[]> {
  const prompt = `
Generate 5-7 personalized alternative learning suggestions for someone learning "${preferences.topic}".

Student Profile:
- Current Level: ${preferences.currentLevel}
- Learning Goal: ${preferences.learningGoal}
- Time Available: ${preferences.timeAvailable} per week
- Specific Skills: ${preferences.specificSkills}

Provide practical, actionable suggestions that complement formal courses, such as:
- Community resources and networking opportunities
- Hands-on practice ideas and projects
- Industry certifications or credentials
- Free resources and tools
- Real-world application opportunities
- Professional development activities

Make suggestions specific to their topic and goals. Respond with a JSON array of strings.
Example: ["Join the React developers community on Discord", "Build 3 portfolio projects using your new skills"]

Respond with ONLY the JSON array, no additional text.`

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a learning advisor providing practical, actionable suggestions. Always respond with valid JSON array of strings only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`)
  }

  const data = await response.json()
  const aiResponse = data.choices[0]?.message?.content

  if (!aiResponse) {
    throw new Error('No response from Groq AI suggestions')
  }

  const suggestions = JSON.parse(aiResponse)
  return Array.isArray(suggestions) ? suggestions : []
}

function generateSmartSuggestions(preferences: LearningPreferences): string[] {
  const { topic, learningGoal, currentLevel, timeAvailable } = preferences
  const topicLower = topic.toLowerCase()
  const suggestions: string[] = []

  // Topic-specific suggestions
  if (topicLower.includes('web development') || topicLower.includes('web dev')) {
    suggestions.push(
      'Join the freeCodeCamp community and complete their web development curriculum',
      'Build and deploy 3-5 projects to GitHub Pages to create a portfolio',
      'Contribute to open-source projects on GitHub to gain real-world experience',
      'Follow web development influencers on Twitter and YouTube for latest trends'
    )
  } else if (topicLower.includes('data science') || topicLower.includes('data')) {
    suggestions.push(
      'Participate in Kaggle competitions to practice with real datasets',
      'Join the r/datascience community on Reddit for discussions and advice',
      'Complete Google Data Analytics or IBM Data Science certificates',
      'Build a data science blog to document your learning journey'
    )
  } else if (topicLower.includes('machine learning') || topicLower.includes('ml')) {
    suggestions.push(
      'Implement ML algorithms from scratch to understand the fundamentals',
      'Join ML Twitter community and follow researchers like Andrew Ng',
      'Participate in ML competitions on Kaggle and DrivenData',
      'Read and implement papers from arXiv to stay current with research'
    )
  } else if (topicLower.includes('marketing')) {
    suggestions.push(
      'Start a personal blog or social media account to practice content creation',
      'Get certified in Google Ads, Facebook Blueprint, and HubSpot',
      'Offer to help local businesses with their digital marketing for experience',
      'Join marketing communities like GrowthHackers and Marketing Land'
    )
  } else if (topicLower.includes('python')) {
    suggestions.push(
      'Solve coding challenges on LeetCode, HackerRank, and Codewars daily',
      'Join the Python community on Discord and Reddit for help and networking',
      'Contribute to Python open-source projects to improve your skills',
      'Build automation scripts for daily tasks to practice Python'
    )
  } else if (topicLower.includes('javascript')) {
    suggestions.push(
      'Complete the JavaScript30 challenge by Wes Bos for hands-on practice',
      'Join the JavaScript community on Discord and follow JS influencers',
      'Build and deploy interactive web applications using modern frameworks',
      'Contribute to JavaScript open-source libraries on GitHub'
    )
  }

  // Goal-specific suggestions
  if (learningGoal === 'career-change') {
    suggestions.push(
      'Network with professionals in your target field through LinkedIn and industry events',
      'Create a strong portfolio showcasing your new skills to potential employers',
      'Consider informational interviews with people in your desired role'
    )
  } else if (learningGoal === 'freelancing') {
    suggestions.push(
      'Build a professional portfolio website showcasing your best work',
      'Join freelancing platforms like Upwork, Fiverr, or specialized job boards',
      'Network with other freelancers and potential clients in online communities'
    )
  } else if (learningGoal === 'business') {
    suggestions.push(
      'Apply your learning to solve real business problems in your industry',
      'Connect with entrepreneurs and business owners who might benefit from your skills',
      'Consider creating a side project or startup to validate your business ideas'
    )
  }

  // Level-specific suggestions
  if (currentLevel === 'complete-beginner') {
    suggestions.push(
      'Set up a consistent daily learning routine, even if just 30 minutes per day',
      'Find a study buddy or join a beginner-friendly learning group for support'
    )
  } else if (currentLevel === 'advanced') {
    suggestions.push(
      'Mentor beginners in your field to reinforce your knowledge and give back',
      'Stay updated with the latest industry trends and emerging technologies'
    )
  }

  // Time-based suggestions
  if (timeAvailable === '1-3-hours') {
    suggestions.push(
      'Use micro-learning techniques: focus on one small concept per day',
      'Listen to relevant podcasts during commutes or exercise'
    )
  } else if (timeAvailable === '15-plus-hours') {
    suggestions.push(
      'Consider intensive bootcamps or immersive learning programs',
      'Take on larger, more complex projects that showcase advanced skills'
    )
  }

  // General suggestions that apply to everyone
  suggestions.push(
    'Document your learning journey through a blog, vlog, or social media',
    'Attend virtual conferences, webinars, and meetups in your field of interest',
    'Set up a learning accountability system with regular progress check-ins'
  )

  // Return a curated selection of 6-8 most relevant suggestions
  return suggestions.slice(0, Math.min(8, suggestions.length))
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences: LearningPreferences = await request.json()

    // Validate required fields
    if (!preferences.topic || !preferences.currentLevel || !preferences.timeAvailable || !preferences.learningGoal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate all components in parallel for better performance
    const [steps, courseRecommendations, alternativeSuggestions] = await Promise.all([
      generateRoadmapSteps(preferences),
      findMatchingCourses(preferences),
      generateAlternativeSuggestions(preferences)
    ])

    // Calculate total duration
    const totalWeeks = steps.reduce((total: number, step: RoadmapStep) => {
      const weeks = parseInt(step.estimatedTime.split('-')[0]) || 2
      return total + weeks
    }, 0)

    const roadmap = {
      title: `${preferences.topic} Learning Path`,
      description: `A personalized roadmap to master ${preferences.topic} based on your ${preferences.currentLevel} level and ${preferences.timeAvailable} weekly commitment.`,
      totalDuration: `${totalWeeks}-${totalWeeks + Math.floor(totalWeeks * 0.5)} weeks`,
      steps,
      courseRecommendations,
      alternativeSuggestions
    }

    return NextResponse.json(roadmap)
  } catch (error) {
    console.error('Error generating roadmap:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}