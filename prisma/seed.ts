import "dotenv/config"
import { prisma } from "../lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  console.log("🌱 Starting comprehensive seed...")

  // Clear existing data
  await prisma.revisionSession.deleteMany()
  await prisma.revisionStreak.deleteMany()
  await prisma.announcementLike.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.quizAttempt.deleteMany()
  await prisma.quizQuestion.deleteMany()
  await prisma.customQuiz.deleteMany()
  await prisma.achievement.deleteMany()

  await prisma.reply.deleteMany()
  await prisma.thread.deleteMany()
  await prisma.learningSession.deleteMany()
  await prisma.progress.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.course.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  const hashedPassword = await bcrypt.hash("password123", 10)

  // Create diverse users
  const teacher1 = await prisma.user.create({
    data: {
      email: "sarah.johnson@edubridge.dev",
      name: "Dr. Sarah Johnson",
      role: "TEACHER",
      passwordHash: hashedPassword,
      totalPoints: 2500,
      currentStreak: 15,
      longestStreak: 30,
      level: 5,
      lastActivityDate: new Date(),
    },
  })

  const teacher2 = await prisma.user.create({
    data: {
      email: "mike.chen@edubridge.dev",
      name: "Prof. Mike Chen",
      role: "TEACHER",
      passwordHash: hashedPassword,
      totalPoints: 3200,
      currentStreak: 22,
      longestStreak: 45,
      level: 6,
      lastActivityDate: new Date(),
    },
  })

  const teacher3 = await prisma.user.create({
    data: {
      email: "emma.davis@edubridge.dev",
      name: "Dr. Emma Davis",
      role: "TEACHER",
      passwordHash: hashedPassword,
      totalPoints: 1800,
      currentStreak: 8,
      longestStreak: 20,
      level: 4,
      lastActivityDate: new Date(),
    },
  })

  const students = await Promise.all([
    prisma.user.create({
      data: {
        email: "alex.smith@student.edu",
        name: "Alex Smith",
        role: "STUDENT",
        passwordHash: hashedPassword,
        totalPoints: 1250,
        currentStreak: 7,
        longestStreak: 12,
        level: 3,
        lastActivityDate: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "maria.garcia@student.edu",
        name: "Maria Garcia",
        role: "STUDENT",
        passwordHash: hashedPassword,
        totalPoints: 890,
        currentStreak: 3,
        longestStreak: 8,
        level: 2,
        lastActivityDate: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "james.wilson@student.edu",
        name: "James Wilson",
        role: "STUDENT",
        passwordHash: hashedPassword,
        totalPoints: 2100,
        currentStreak: 12,
        longestStreak: 18,
        level: 4,
        lastActivityDate: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "lisa.brown@student.edu",
        name: "Lisa Brown",
        role: "STUDENT",
        passwordHash: hashedPassword,
        totalPoints: 650,
        currentStreak: 2,
        longestStreak: 5,
        level: 2,
        lastActivityDate: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "david.lee@student.edu",
        name: "David Lee",
        role: "STUDENT",
        passwordHash: hashedPassword,
        totalPoints: 1750,
        currentStreak: 9,
        longestStreak: 15,
        level: 3,
        lastActivityDate: new Date(),
      },
    }),
  ])

  // Create comprehensive courses
  const webDevCourse = await prisma.course.create({
    data: {
      title: "Complete Web Development Bootcamp",
      description: "Master modern web development with React, Node.js, and TypeScript. Build real-world projects and deploy them to production.",
      price: 99.99,
      status: "published",
      createdById: teacher1.id,
    },
  })

  const dataScienceCourse = await prisma.course.create({
    data: {
      title: "Data Science with Python",
      description: "Learn data analysis, machine learning, and visualization with Python. Work with real datasets and build predictive models.",
      price: 129.99,
      status: "published",
      createdById: teacher2.id,
    },
  })

  const mobileCourse = await prisma.course.create({
    data: {
      title: "Mobile App Development with React Native",
      description: "Build cross-platform mobile apps for iOS and Android using React Native and Expo.",
      price: 89.99,
      status: "published",
      createdById: teacher3.id,
    },
  })

  const aiCourse = await prisma.course.create({
    data: {
      title: "Introduction to Artificial Intelligence",
      description: "Explore the fundamentals of AI, machine learning algorithms, and neural networks.",
      price: 149.99,
      status: "published",
      createdById: teacher1.id,
    },
  })

  const freeCourse = await prisma.course.create({
    data: {
      title: "Getting Started with Programming",
      description: "A beginner-friendly introduction to programming concepts using JavaScript.",
      price: 0,
      status: "published",
      createdById: teacher2.id,
    },
  })

  // Create detailed lessons for Web Development course
  const webDevLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        courseId: webDevCourse.id,
        title: "HTML Fundamentals",
        description: "Learn the building blocks of web pages with HTML5",
        contentTypes: ["text", "video", "links"],
        textContent: "HTML (HyperText Markup Language) is the standard markup language for creating web pages. In this lesson, we'll cover semantic HTML, accessibility best practices, and modern HTML5 features.",
        videoType: "youtube",
        youtubeUrl: "https://www.youtube.com/embed/UB1O30fR-EE",
        externalLinks: ["https://developer.mozilla.org/en-US/docs/Web/HTML", "https://html.spec.whatwg.org/"],
        order: 1,
      },
    }),
    prisma.lesson.create({
      data: {
        courseId: webDevCourse.id,
        title: "CSS Styling and Layout",
        description: "Master CSS for beautiful and responsive designs",
        contentTypes: ["text", "video"],
        textContent: "CSS (Cascading Style Sheets) controls the presentation of HTML elements. We'll explore Flexbox, Grid, animations, and responsive design principles.",
        videoType: "youtube",
        youtubeUrl: "https://www.youtube.com/embed/1Rs2ND1ryYc",
        order: 2,
      },
    }),
    prisma.lesson.create({
      data: {
        courseId: webDevCourse.id,
        title: "JavaScript Basics",
        description: "Introduction to JavaScript programming",
        contentTypes: ["text", "links"],
        textContent: "JavaScript is the programming language of the web. Learn variables, functions, objects, and DOM manipulation.",
        externalLinks: ["https://javascript.info/", "https://developer.mozilla.org/en-US/docs/Web/JavaScript"],
        order: 3,
      },
    }),
    prisma.lesson.create({
      data: {
        courseId: webDevCourse.id,
        title: "React Fundamentals",
        description: "Build dynamic user interfaces with React",
        contentTypes: ["text", "video", "links"],
        textContent: "React is a popular JavaScript library for building user interfaces. Learn components, props, state, and hooks.",
        videoType: "youtube",
        youtubeUrl: "https://www.youtube.com/embed/Ke90Tje7VS0",
        externalLinks: ["https://react.dev/", "https://create-react-app.dev/"],
        order: 4,
      },
    }),
    prisma.lesson.create({
      data: {
        courseId: webDevCourse.id,
        title: "Node.js Backend Development",
        description: "Server-side JavaScript with Node.js and Express",
        contentTypes: ["text", "video"],
        textContent: "Build scalable backend applications with Node.js. Learn about Express.js, middleware, routing, and database integration.",
        videoType: "youtube",
        youtubeUrl: "https://www.youtube.com/embed/TlB_eWDSMt4",
        order: 5,
      },
    }),
  ])

  // Create lessons for Data Science course
  const dataScienceLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        courseId: dataScienceCourse.id,
        title: "Python for Data Science",
        description: "Essential Python libraries for data analysis",
        contentTypes: ["text", "links"],
        textContent: "Learn NumPy, Pandas, and Matplotlib - the core libraries for data science in Python.",
        externalLinks: ["https://numpy.org/", "https://pandas.pydata.org/", "https://matplotlib.org/"],
        order: 1,
      },
    }),
    prisma.lesson.create({
      data: {
        courseId: dataScienceCourse.id,
        title: "Data Visualization",
        description: "Create compelling visualizations with Python",
        contentTypes: ["text", "video"],
        textContent: "Master data visualization techniques using Matplotlib, Seaborn, and Plotly.",
        videoType: "youtube",
        youtubeUrl: "https://www.youtube.com/embed/UO98lJQ3QGI",
        order: 2,
      },
    }),
    prisma.lesson.create({
      data: {
        courseId: dataScienceCourse.id,
        title: "Machine Learning Basics",
        description: "Introduction to supervised and unsupervised learning",
        contentTypes: ["text", "video", "links"],
        textContent: "Understand the fundamentals of machine learning algorithms and when to use them.",
        videoType: "youtube",
        youtubeUrl: "https://www.youtube.com/embed/aircAruvnKk",
        externalLinks: ["https://scikit-learn.org/", "https://www.tensorflow.org/"],
        order: 3,
      },
    }),
  ])

  // Create lessons for Mobile Development course
  const mobileLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        courseId: mobileCourse.id,
        title: "React Native Setup",
        description: "Setting up your development environment",
        contentTypes: ["text", "links"],
        textContent: "Install and configure React Native CLI, Android Studio, and Xcode for mobile development.",
        externalLinks: ["https://reactnative.dev/docs/environment-setup", "https://expo.dev/"],
        order: 1,
      },
    }),
    prisma.lesson.create({
      data: {
        courseId: mobileCourse.id,
        title: "Building Your First App",
        description: "Create a simple mobile application",
        contentTypes: ["text", "video"],
        textContent: "Build a todo app with navigation, state management, and local storage.",
        videoType: "youtube",
        youtubeUrl: "https://www.youtube.com/embed/0-S5a0eXPoc",
        order: 2,
      },
    }),
  ])

  // Create lessons for AI course
  const aiLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        courseId: aiCourse.id,
        title: "What is Artificial Intelligence?",
        description: "Understanding AI concepts and applications",
        contentTypes: ["text", "video", "links"],
        textContent: "Explore the history, current state, and future of artificial intelligence.",
        videoType: "youtube",
        youtubeUrl: "https://www.youtube.com/embed/ad79nYk2keg",
        externalLinks: ["https://www.ibm.com/cloud/learn/what-is-artificial-intelligence"],
        order: 1,
      },
    }),
    prisma.lesson.create({
      data: {
        courseId: aiCourse.id,
        title: "Neural Networks Explained",
        description: "Deep dive into neural network architecture",
        contentTypes: ["text", "video"],
        textContent: "Understand how neural networks work, from perceptrons to deep learning.",
        videoType: "youtube",
        youtubeUrl: "https://www.youtube.com/embed/aircAruvnKk",
        order: 2,
      },
    }),
  ])

  // Create lessons for Free Programming course
  const freeLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        courseId: freeCourse.id,
        title: "Programming Fundamentals",
        description: "Basic programming concepts everyone should know",
        contentTypes: ["text", "links"],
        textContent: "Learn about variables, loops, conditions, and functions - the building blocks of programming.",
        externalLinks: ["https://www.codecademy.com/learn/introduction-to-programming"],
        order: 1,
      },
    }),
    prisma.lesson.create({
      data: {
        courseId: freeCourse.id,
        title: "Your First JavaScript Program",
        description: "Write and run your first program",
        contentTypes: ["text", "video"],
        textContent: "Create a simple calculator using JavaScript and see your code come to life.",
        videoType: "youtube",
        youtubeUrl: "https://www.youtube.com/embed/PkZNo7MFNFg",
        order: 2,
      },
    }),
  ])

  // Create enrollments with realistic patterns
  const enrollments = await Promise.all([
    // Student enrollments in multiple courses
    prisma.enrollment.create({ data: { userId: students[0].id, courseId: webDevCourse.id, status: "active" } }),
    prisma.enrollment.create({ data: { userId: students[0].id, courseId: freeCourse.id, status: "completed" } }),
    prisma.enrollment.create({ data: { userId: students[1].id, courseId: dataScienceCourse.id, status: "active" } }),
    prisma.enrollment.create({ data: { userId: students[1].id, courseId: freeCourse.id, status: "active" } }),
    prisma.enrollment.create({ data: { userId: students[2].id, courseId: webDevCourse.id, status: "active" } }),
    prisma.enrollment.create({ data: { userId: students[2].id, courseId: mobileCourse.id, status: "active" } }),
    prisma.enrollment.create({ data: { userId: students[2].id, courseId: aiCourse.id, status: "active" } }),
    prisma.enrollment.create({ data: { userId: students[3].id, courseId: freeCourse.id, status: "active" } }),
    prisma.enrollment.create({ data: { userId: students[4].id, courseId: webDevCourse.id, status: "active" } }),
    prisma.enrollment.create({ data: { userId: students[4].id, courseId: dataScienceCourse.id, status: "active" } }),
  ])

  // Create progress data showing various completion levels
  const progressData = await Promise.all([
    // Alex's progress (advanced student)
    prisma.progress.create({ data: { userId: students[0].id, lessonId: webDevLessons[0].id, percent: 100, completedAt: new Date(), pointsEarned: 50, timeSpent: 1800 } }),
    prisma.progress.create({ data: { userId: students[0].id, lessonId: webDevLessons[1].id, percent: 100, completedAt: new Date(), pointsEarned: 50, timeSpent: 2400 } }),
    prisma.progress.create({ data: { userId: students[0].id, lessonId: webDevLessons[2].id, percent: 75, pointsEarned: 35, timeSpent: 1200 } }),
    
    // Maria's progress (beginner)
    prisma.progress.create({ data: { userId: students[1].id, lessonId: dataScienceLessons[0].id, percent: 60, pointsEarned: 30, timeSpent: 900 } }),
    prisma.progress.create({ data: { userId: students[1].id, lessonId: freeLessons[0].id, percent: 100, completedAt: new Date(), pointsEarned: 40, timeSpent: 1500 } }),
    
    // James's progress (active learner)
    prisma.progress.create({ data: { userId: students[2].id, lessonId: webDevLessons[0].id, percent: 100, completedAt: new Date(), pointsEarned: 50, timeSpent: 1600 } }),
    prisma.progress.create({ data: { userId: students[2].id, lessonId: webDevLessons[1].id, percent: 90, pointsEarned: 45, timeSpent: 2000 } }),
    prisma.progress.create({ data: { userId: students[2].id, lessonId: mobileLessons[0].id, percent: 100, completedAt: new Date(), pointsEarned: 50, timeSpent: 1400 } }),
    prisma.progress.create({ data: { userId: students[2].id, lessonId: aiLessons[0].id, percent: 80, pointsEarned: 40, timeSpent: 1800 } }),
  ])

  // Create learning sessions for analytics
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  
  await Promise.all([
    prisma.learningSession.create({
      data: {
        userId: students[0].id,
        lessonId: webDevLessons[0].id,
        courseId: webDevCourse.id,
        startTime: yesterday,
        endTime: new Date(yesterday.getTime() + 30 * 60 * 1000),
        duration: 1800,
        date: yesterday,
      },
    }),
    prisma.learningSession.create({
      data: {
        userId: students[2].id,
        lessonId: webDevLessons[1].id,
        courseId: webDevCourse.id,
        startTime: now,
        endTime: new Date(now.getTime() + 45 * 60 * 1000),
        duration: 2700,
        date: now,
      },
    }),
  ])

  // Create community forum threads
  const threads = await Promise.all([
    prisma.thread.create({
      data: {
        title: "Best practices for React component organization?",
        body: "I'm working on a large React project and struggling with how to organize my components. What folder structure do you recommend?",
        authorId: students[0].id,
        courseId: webDevCourse.id,
      },
    }),
    prisma.thread.create({
      data: {
        title: "Data visualization libraries comparison",
        body: "Can someone help me understand the differences between Matplotlib, Seaborn, and Plotly? Which one should I use for interactive dashboards?",
        authorId: students[1].id,
        courseId: dataScienceCourse.id,
      },
    }),
    prisma.thread.create({
      data: {
        title: "Mobile app deployment to app stores",
        body: "What's the process for deploying React Native apps to both iOS App Store and Google Play Store? Any gotchas I should know about?",
        authorId: students[2].id,
        courseId: mobileCourse.id,
      },
    }),
    prisma.thread.create({
      data: {
        title: "General programming question about algorithms",
        body: "I'm trying to understand Big O notation better. Can someone explain it in simple terms with practical examples?",
        authorId: students[3].id,
      },
    }),
  ])

  // Create replies to forum threads
  await Promise.all([
    prisma.reply.create({
      data: {
        body: "I recommend organizing by feature rather than by file type. Create folders like 'components/UserProfile', 'components/Dashboard', etc. Each folder contains the component, its styles, tests, and related files.",
        authorId: teacher1.id,
        threadId: threads[0].id,
      },
    }),
    prisma.reply.create({
      data: {
        body: "Great question! I use a similar approach. Also consider using index.js files to make imports cleaner.",
        authorId: students[2].id,
        threadId: threads[0].id,
      },
    }),
    prisma.reply.create({
      data: {
        body: "For interactive dashboards, I'd recommend Plotly. It has great interactivity out of the box and works well with web frameworks. Matplotlib is better for static publication-quality plots.",
        authorId: teacher2.id,
        threadId: threads[1].id,
      },
    }),
    prisma.reply.create({
      data: {
        body: "Big O notation describes how an algorithm's performance scales with input size. O(1) is constant time (like array access), O(n) is linear (like searching an unsorted array), O(n²) is quadratic (like nested loops). Think of it as 'how much slower does this get as my data grows?'",
        authorId: teacher1.id,
        threadId: threads[3].id,
      },
    }),
  ])

  // Create custom quizzes
  const webDevQuiz = await prisma.customQuiz.create({
    data: {
      title: "JavaScript Fundamentals Quiz",
      description: "Test your knowledge of JavaScript basics",
      topic: "JavaScript",
      difficulty: "medium",
      isPublic: true,
      createdById: teacher1.id,
    },
  })

  const dataQuiz = await prisma.customQuiz.create({
    data: {
      title: "Python Data Structures",
      description: "Quiz on Python lists, dictionaries, and sets",
      topic: "Python",
      difficulty: "easy",
      isPublic: true,
      createdById: teacher2.id,
    },
  })

  // Create quiz questions
  await Promise.all([
    prisma.quizQuestion.create({
      data: {
        quizId: webDevQuiz.id,
        question: "What is the correct way to declare a variable in JavaScript?",
        options: ["var myVar = 5;", "variable myVar = 5;", "v myVar = 5;", "declare myVar = 5;"],
        correctAnswer: 0,
        explanation: "In JavaScript, variables are declared using 'var', 'let', or 'const' keywords.",
        points: 10,
      },
    }),
    prisma.quizQuestion.create({
      data: {
        quizId: webDevQuiz.id,
        question: "Which method is used to add an element to the end of an array?",
        options: ["append()", "push()", "add()", "insert()"],
        correctAnswer: 1,
        explanation: "The push() method adds one or more elements to the end of an array.",
        points: 10,
      },
    }),
    prisma.quizQuestion.create({
      data: {
        quizId: dataQuiz.id,
        question: "Which Python data structure is ordered and mutable?",
        options: ["tuple", "set", "list", "frozenset"],
        correctAnswer: 2,
        explanation: "Lists in Python are ordered collections that can be modified (mutable).",
        points: 10,
      },
    }),
  ])

  // Create quiz attempts
  await Promise.all([
    prisma.quizAttempt.create({
      data: {
        userId: students[0].id,
        quizId: webDevQuiz.id,
        score: 18,
        totalPoints: 20,
        answers: { "0": 0, "1": 1 },
        timeSpent: 300,
        completed: true,
      },
    }),
    prisma.quizAttempt.create({
      data: {
        userId: students[1].id,
        quizId: dataQuiz.id,
        score: 10,
        totalPoints: 10,
        answers: { "0": 2 },
        timeSpent: 180,
        completed: true,
      },
    }),
  ])

  // Create achievements
  await Promise.all([
    prisma.achievement.create({
      data: {
        userId: students[0].id,
        type: "first_lesson",
        title: "First Steps",
        description: "Completed your first lesson",
        points: 50,
      },
    }),
    prisma.achievement.create({
      data: {
        userId: students[0].id,
        type: "week_streak",
        title: "Week Warrior",
        description: "Maintained a 7-day learning streak",
        points: 100,
      },
    }),
    prisma.achievement.create({
      data: {
        userId: students[2].id,
        type: "quiz_master",
        title: "Quiz Master",
        description: "Scored 90% or higher on a quiz",
        points: 75,
      },
    }),
    prisma.achievement.create({
      data: {
        userId: students[1].id,
        type: "course_complete",
        title: "Course Conqueror",
        description: "Completed your first course",
        points: 200,
      },
    }),
  ])



  // Create announcements
  const announcements = await Promise.all([
    prisma.announcement.create({
      data: {
        title: "Welcome to the Web Development Bootcamp!",
        content: "We're excited to have you join our comprehensive web development program. Make sure to join our Discord community for real-time help and networking opportunities. Don't forget to complete the setup instructions in Lesson 1 before moving forward.",
        authorId: teacher1.id,
        courseId: webDevCourse.id,
        isPublic: false,
      },
    }),
    prisma.announcement.create({
      data: {
        title: "New AI Course Features Released!",
        content: "We've just added interactive coding exercises and a new AI tutor feature to help you practice machine learning concepts. Check out the updated lessons and let us know what you think!",
        authorId: teacher1.id,
        courseId: aiCourse.id,
        isPublic: false,
      },
    }),
    prisma.announcement.create({
      data: {
        title: "Platform Update: New Quiz System",
        content: "We've launched our new adaptive quiz system! Create custom quizzes, track your progress, and compete with other learners. The system now supports multiple question types and provides detailed explanations for each answer.",
        authorId: teacher2.id,
        isPublic: true,
      },
    }),
    prisma.announcement.create({
      data: {
        title: "Data Science Workshop This Weekend",
        content: "Join us for a live workshop on advanced data visualization techniques. We'll cover interactive dashboards with Plotly and real-time data processing. Register in the course dashboard!",
        authorId: teacher2.id,
        courseId: dataScienceCourse.id,
        isPublic: false,
      },
    }),
  ])

  // Create announcement likes
  await Promise.all([
    prisma.announcementLike.create({
      data: { userId: students[0].id, announcementId: announcements[0].id },
    }),
    prisma.announcementLike.create({
      data: { userId: students[2].id, announcementId: announcements[0].id },
    }),
    prisma.announcementLike.create({
      data: { userId: students[1].id, announcementId: announcements[2].id },
    }),
    prisma.announcementLike.create({
      data: { userId: students[3].id, announcementId: announcements[2].id },
    }),
    prisma.announcementLike.create({
      data: { userId: students[4].id, announcementId: announcements[2].id },
    }),
  ])

  // Create revision sessions
  await Promise.all([
    prisma.revisionSession.create({
      data: {
        userId: students[0].id,
        courseId: webDevCourse.id,
        topic: "React Hooks",
        explanation: "I explained how useState and useEffect work in React functional components, including dependency arrays and cleanup functions.",
        score: 85,
        feedback: {
          strengths: ["Good understanding of useState", "Clear explanation of component lifecycle"],
          improvements: ["Could elaborate more on useEffect cleanup", "Practice with custom hooks"],
          suggestions: ["Try building a custom hook for API calls", "Review the official React docs on hooks"]
        },
        duration: 900,
        method: "text",
      },
    }),
    prisma.revisionSession.create({
      data: {
        userId: students[1].id,
        courseId: dataScienceCourse.id,
        topic: "Pandas DataFrames",
        explanation: "I covered how to manipulate data using pandas, including filtering, grouping, and merging operations.",
        score: 78,
        feedback: {
          strengths: ["Good grasp of basic operations", "Understands data filtering"],
          improvements: ["Need more practice with groupby operations", "Learn about pivot tables"],
          suggestions: ["Work through the pandas documentation examples", "Try analyzing a real dataset"]
        },
        duration: 1200,
        method: "voice",
      },
    }),
  ])

  // Create revision streaks
  await Promise.all([
    prisma.revisionStreak.create({
      data: {
        userId: students[0].id,
        currentStreak: 5,
        longestStreak: 12,
        lastRevisionDate: new Date(),
      },
    }),
    prisma.revisionStreak.create({
      data: {
        userId: students[1].id,
        currentStreak: 2,
        longestStreak: 7,
        lastRevisionDate: yesterday,
      },
    }),
  ])

  console.log("✅ Comprehensive seed completed!")
  console.log("\n📊 Created:")
  console.log("- 8 Users (3 teachers, 5 students)")
  console.log("- 5 Courses (Web Dev, Data Science, Mobile, AI, Free Programming)")
  console.log("- 12 Lessons with rich content (text, videos, links)")
  console.log("- 10 Enrollments across different courses")
  console.log("- Progress tracking with various completion levels")
  console.log("- 4 Forum threads with replies")
  console.log("- 2 Custom quizzes with questions and attempts")
  console.log("- Achievement system with badges")

  console.log("- 4 Announcements with likes")
  console.log("- Revision sessions and streaks")
  console.log("- Learning analytics data")
  
  console.log("\n🔑 Demo Accounts:")
  console.log("Teachers:")
  console.log("- sarah.johnson@edubridge.dev (password: password123)")
  console.log("- mike.chen@edubridge.dev (password: password123)")
  console.log("- emma.davis@edubridge.dev (password: password123)")
  console.log("\nStudents:")
  console.log("- alex.smith@student.edu (password: password123)")
  console.log("- maria.garcia@student.edu (password: password123)")
  console.log("- james.wilson@student.edu (password: password123)")
  console.log("- lisa.brown@student.edu (password: password123)")
  console.log("- david.lee@student.edu (password: password123)")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})