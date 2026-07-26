const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedSampleCourses() {
    try {
        // Find a teacher user to assign courses to
        const teacher = await prisma.user.findFirst({
            where: { role: 'TEACHER' }
        })

        if (!teacher) {
            console.log('No teacher found. Please create a teacher user first.')
            return
        }

        console.log(`Using teacher: ${teacher.name} (${teacher.id})`)

        const sampleCourses = [
            {
                title: "Complete Web Development Bootcamp",
                description: "Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB. Build full-stack web applications from scratch with hands-on projects and real-world examples.",
                price: 0,
                status: "published",
                createdById: teacher.id
            },
            {
                title: "Python for Data Science and Machine Learning",
                description: "Master Python programming for data analysis, visualization, and machine learning. Learn pandas, numpy, matplotlib, scikit-learn, and build ML models.",
                price: 1999,
                status: "published",
                createdById: teacher.id
            },
            {
                title: "React.js - The Complete Guide",
                description: "Build modern, reactive user interfaces with React.js. Learn hooks, context, routing, state management, and deploy production-ready applications.",
                price: 1499,
                status: "published",
                createdById: teacher.id
            },
            {
                title: "Digital Marketing Masterclass",
                description: "Complete digital marketing course covering SEO, social media marketing, Google Ads, email marketing, content marketing, and analytics.",
                price: 2499,
                status: "published",
                createdById: teacher.id
            },
            {
                title: "JavaScript Fundamentals for Beginners",
                description: "Learn JavaScript from scratch. Understand variables, functions, objects, DOM manipulation, and build interactive web applications step by step.",
                price: 0,
                status: "published",
                createdById: teacher.id
            },
            {
                title: "Advanced Machine Learning with TensorFlow",
                description: "Deep dive into neural networks, deep learning, computer vision, and NLP using TensorFlow and Keras. Build and deploy AI models.",
                price: 3999,
                status: "published",
                createdById: teacher.id
            },
            {
                title: "Node.js Backend Development",
                description: "Build scalable backend applications with Node.js, Express, MongoDB, and REST APIs. Learn authentication, security, and deployment.",
                price: 1799,
                status: "published",
                createdById: teacher.id
            },
            {
                title: "UI/UX Design Fundamentals",
                description: "Learn user interface and user experience design principles. Master Figma, create wireframes, prototypes, and design systems.",
                price: 2199,
                status: "published",
                createdById: teacher.id
            },
            {
                title: "Data Analysis with Excel and Power BI",
                description: "Master data analysis using Excel and Power BI. Learn pivot tables, charts, DAX formulas, and create interactive dashboards.",
                price: 0,
                status: "published",
                createdById: teacher.id
            },
            {
                title: "Mobile App Development with React Native",
                description: "Build cross-platform mobile apps using React Native. Learn navigation, state management, native modules, and publish to app stores.",
                price: 2799,
                status: "published",
                createdById: teacher.id
            },
            {
                title: "Cybersecurity Fundamentals",
                description: "Learn cybersecurity basics, network security, ethical hacking, penetration testing, and security best practices for organizations.",
                price: 2999,
                status: "published",
                createdById: teacher.id
            },
            {
                title: "Cloud Computing with AWS",
                description: "Master Amazon Web Services (AWS). Learn EC2, S3, Lambda, RDS, and deploy scalable cloud applications with best practices.",
                price: 3499,
                status: "published",
                createdById: teacher.id
            }
        ]

        console.log('Creating sample courses...')

        for (const courseData of sampleCourses) {
            const course = await prisma.course.create({
                data: courseData
            })

            // Add some sample lessons for each course
            const lessonCount = Math.floor(Math.random() * 8) + 5 // 5-12 lessons

            for (let i = 1; i <= lessonCount; i++) {
                await prisma.lesson.create({
                    data: {
                        courseId: course.id,
                        title: `Lesson ${i}: ${courseData.title.split(' ')[0]} Basics ${i}`,
                        description: `Learn the fundamentals of ${courseData.title.toLowerCase()} in this comprehensive lesson.`,
                        contentTypes: ['text', 'video'],
                        textContent: `This is the content for lesson ${i} of ${courseData.title}.`,
                        order: i
                    }
                })
            }

            console.log(`✓ Created course: ${courseData.title} with ${lessonCount} lessons`)
        }

        console.log('\n🎉 Sample courses created successfully!')
        console.log('The recommendation system should now work properly with realistic course data.')

    } catch (error) {
        console.error('Error seeding courses:', error)
    } finally {
        await prisma.$disconnect()
    }
}

seedSampleCourses()