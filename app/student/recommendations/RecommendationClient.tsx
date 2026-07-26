"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, BookOpen, Clock, Target, Lightbulb, ArrowRight, Star } from "lucide-react"
import { useRouter } from "next/navigation"

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

interface GeneratedRoadmap {
  title: string
  description: string
  totalDuration: string
  steps: RoadmapStep[]
  courseRecommendations: CourseRecommendation[]
  alternativeSuggestions: string[]
}

export function RecommendationClient() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'results'>('form')
  const [loading, setLoading] = useState(false)
  const [preferences, setPreferences] = useState<LearningPreferences>({
    topic: '',
    currentLevel: '',
    timeAvailable: '',
    learningGoal: '',
    preferredFormat: [],
    timeline: '',
    specificSkills: '',
    priorExperience: ''
  })
  const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof LearningPreferences, value: string) => {
    setPreferences(prev => ({ ...prev, [field]: value }))
  }

  const handleFormatChange = (format: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      preferredFormat: checked
        ? [...prev.preferredFormat, format]
        : prev.preferredFormat.filter(f => f !== format)
    }))
  }

  const generateRoadmap = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('Generating roadmap with preferences:', preferences)
      
      const response = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || `Failed to generate roadmap (${response.status})`)
      }

      const data = await response.json()
      console.log('Received roadmap data:', data)
      setRoadmap(data)
      setStep('results')
    } catch (error) {
      console.error('Error generating roadmap:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = preferences.topic && preferences.currentLevel &&
    preferences.timeAvailable && preferences.learningGoal

  if (step === 'results' && roadmap) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep('form')}
                size="sm"
                className="text-sm w-fit"
              >
                ← <span className="hidden sm:inline">Back to Form</span><span className="sm:hidden">Back</span>
              </Button>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => {
                    const roadmapText = `
# ${roadmap.title}

${roadmap.description}

**Duration:** ${roadmap.totalDuration}

## Learning Steps:
${roadmap.steps.map((step, i) => `
${i + 1}. **${step.title}** (${step.estimatedTime})
   ${step.description}
   Prerequisites: ${step.prerequisites.join(', ') || 'None'}
`).join('')}

## Recommended Courses:
${roadmap.courseRecommendations.map(course => `
- ${course.title} by ${course.instructor} (${course.matchScore}% match)
  ${course.description}
  Price: ${course.price === 0 ? 'Free' : `₹${course.price}`}
`).join('')}
                    `.trim()

                    navigator.clipboard.writeText(roadmapText)
                    // You could show a toast here
                  }}
                >
                  <span className="hidden sm:inline">Copy Roadmap</span>
                  <span className="sm:hidden">Copy</span>
                </Button>
                <Button
                  onClick={() => window.print()}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Print/Save PDF</span>
                  <span className="sm:hidden">Print</span>
                </Button>
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 break-words">Your Personalized Learning Roadmap</h1>
            <p className="text-sm sm:text-base text-muted-foreground break-words">{roadmap.description}</p>
          </div>

          {/* Roadmap Overview */}
          <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground text-sm sm:text-base break-words">{roadmap.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Learning Path</p>
              </div>
              <div className="text-center">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-secondary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground text-sm sm:text-base">{roadmap.totalDuration}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Estimated Duration</p>
              </div>
              <div className="text-center">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-accent mx-auto mb-2" />
                <h3 className="font-semibold text-foreground text-sm sm:text-base">{roadmap.steps.length} Steps</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Learning Milestones</p>
              </div>
            </div>
          </Card>

          {/* Learning Steps */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Learning Steps</h2>
            <div className="space-y-3 sm:space-y-4">
              {roadmap.steps.map((step, index) => (
                <Card key={step.id} className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground break-words">{step.title}</h3>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          <Badge variant="secondary" className="text-xs">{step.difficulty}</Badge>
                          <Badge variant="outline" className="text-xs">{step.estimatedTime}</Badge>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 break-words">{step.description}</p>

                      {step.prerequisites.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-xs sm:text-sm font-medium text-foreground mb-1">Prerequisites:</h4>
                          <div className="flex flex-wrap gap-1">
                            {step.prerequisites.map((prereq, i) => (
                              <Badge key={i} variant="outline" className="text-xs max-w-full break-all whitespace-normal leading-tight py-1">{prereq}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.resources.length > 0 && (
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium text-foreground mb-1">Resources:</h4>
                          <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
                            {step.resources.map((resource, i) => (
                              <li key={i} className="break-words">• {resource}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Course Recommendations */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Recommended Courses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {roadmap.courseRecommendations.map((course) => (
                <Card key={course.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h3 className="font-semibold text-foreground line-clamp-2 text-sm sm:text-base break-words min-w-0">{course.title}</h3>
                      <Badge
                        variant={course.isAvailable ? "default" : "secondary"}
                        className="text-xs flex-shrink-0"
                      >
                        {course.matchScore}% match
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">by {course.instructor}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 break-words">{course.description}</p>
                  </div>

                  <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Level:</span>
                      <span className="text-foreground">{course.level}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="text-foreground">{course.duration}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-foreground">{course.rating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Students:</span>
                      <span className="text-foreground">{course.enrollments}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm sm:text-lg font-bold text-foreground">
                      {course.price === 0 ? 'Free' : `₹${course.price}`}
                    </span>
                    <Button
                      size="sm"
                      disabled={!course.isAvailable}
                      onClick={() => course.isAvailable ? router.push(`/courses/${course.id}`) : undefined}
                      className="text-xs"
                    >
                      {course.isAvailable ? (
                        <>
                          <span className="hidden sm:inline">View Course</span>
                          <span className="sm:hidden">View</span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">Not Available</span>
                          <span className="sm:hidden">N/A</span>
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Alternative Suggestions */}
          {roadmap.alternativeSuggestions.length > 0 && (
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="break-words">Alternative Learning Suggestions</span>
              </h2>
              <ul className="space-y-2">
                {roadmap.alternativeSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                    <span className="break-words">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2 break-words">Get Your Personalized Learning Roadmap</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">Tell us about your learning goals and we&apos;ll create a customized path just for you</p>
        </div>

        <Card className="p-4 sm:p-6 lg:p-8">
          <form onSubmit={(e) => { e.preventDefault(); generateRoadmap(); }} className="space-y-4 sm:space-y-6">
            {/* Topic */}
            <div>
              <Label htmlFor="topic" className="text-sm sm:text-base font-medium">What do you want to learn? *</Label>
              <Input
                id="topic"
                placeholder="e.g., Web Development, Data Science, Machine Learning, Digital Marketing"
                value={preferences.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                className="mt-1 sm:mt-2 text-sm sm:text-base"
              />
            </div>

            {/* Current Level */}
            <div>
              <Label htmlFor="level" className="text-sm sm:text-base font-medium">What&apos;s your current level? *</Label>
              <Select value={preferences.currentLevel} onValueChange={(value) => handleInputChange('currentLevel', value)}>
                <SelectTrigger className="mt-1 sm:mt-2 text-sm sm:text-base">
                  <SelectValue placeholder="Select your current level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete-beginner">Complete Beginner</SelectItem>
                  <SelectItem value="some-basics">Know Some Basics</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Available */}
            <div>
              <Label htmlFor="time" className="text-sm sm:text-base font-medium">How much time can you dedicate per week? *</Label>
              <Select value={preferences.timeAvailable} onValueChange={(value) => handleInputChange('timeAvailable', value)}>
                <SelectTrigger className="mt-1 sm:mt-2 text-sm sm:text-base">
                  <SelectValue placeholder="Select time commitment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3-hours">1-3 hours</SelectItem>
                  <SelectItem value="4-7-hours">4-7 hours</SelectItem>
                  <SelectItem value="8-15-hours">8-15 hours</SelectItem>
                  <SelectItem value="15-plus-hours">15+ hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Learning Goal */}
            <div>
              <Label htmlFor="goal" className="text-sm sm:text-base font-medium">What&apos;s your main learning goal? *</Label>
              <Select value={preferences.learningGoal} onValueChange={(value) => handleInputChange('learningGoal', value)}>
                <SelectTrigger className="mt-1 sm:mt-2 text-sm sm:text-base">
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="career-change">Career Change</SelectItem>
                  <SelectItem value="skill-upgrade">Skill Upgrade</SelectItem>
                  <SelectItem value="personal-interest">Personal Interest</SelectItem>
                  <SelectItem value="academic-requirement">Academic Requirement</SelectItem>
                  <SelectItem value="freelancing">Start Freelancing</SelectItem>
                  <SelectItem value="business">Start a Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timeline */}
            <div>
              <Label htmlFor="timeline" className="text-sm sm:text-base font-medium">When do you want to achieve your goal?</Label>
              <Select value={preferences.timeline} onValueChange={(value) => handleInputChange('timeline', value)}>
                <SelectTrigger className="mt-1 sm:mt-2 text-sm sm:text-base">
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-month">Within 1 month</SelectItem>
                  <SelectItem value="3-months">Within 3 months</SelectItem>
                  <SelectItem value="6-months">Within 6 months</SelectItem>
                  <SelectItem value="1-year">Within 1 year</SelectItem>
                  <SelectItem value="flexible">I&apos;m flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preferred Learning Formats */}
            <div>
              <Label className="text-sm sm:text-base font-medium">Preferred learning formats (select all that apply):</Label>
              <div className="mt-2 sm:mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {[
                  'Video Tutorials',
                  'Text/Articles',
                  'Interactive Exercises',
                  'Live Sessions',
                  'Project-based',
                  'Community Discussion'
                ].map((format) => (
                  <div key={format} className="flex items-center space-x-2">
                    <Checkbox
                      id={format}
                      checked={preferences.preferredFormat.includes(format)}
                      onCheckedChange={(checked) => handleFormatChange(format, checked as boolean)}
                    />
                    <Label htmlFor={format} className="text-xs sm:text-sm break-words">{format}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Specific Skills */}
            <div>
              <Label htmlFor="skills" className="text-sm sm:text-base font-medium">Any specific skills or technologies you want to focus on?</Label>
              <Textarea
                id="skills"
                placeholder="e.g., React, Python, SEO, Photoshop, etc."
                value={preferences.specificSkills}
                onChange={(e) => handleInputChange('specificSkills', e.target.value)}
                className="mt-1 sm:mt-2 text-sm sm:text-base"
                rows={3}
              />
            </div>

            {/* Prior Experience */}
            <div>
              <Label htmlFor="experience" className="text-sm sm:text-base font-medium">Tell us about your relevant background or experience:</Label>
              <Textarea
                id="experience"
                placeholder="e.g., I have a computer science degree but no practical experience, I've been working in marketing for 2 years, etc."
                value={preferences.priorExperience}
                onChange={(e) => handleInputChange('priorExperience', e.target.value)}
                className="mt-1 sm:mt-2 text-sm sm:text-base"
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-xs sm:text-sm break-words">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full text-sm sm:text-base"
              size="lg"
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Generating Your Roadmap...</span>
                  <span className="sm:hidden">Generating...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Generate My Learning Roadmap</span>
                  <span className="sm:hidden">Generate Roadmap</span>
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}