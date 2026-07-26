"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Users, BookOpen, Zap, Globe, Award, Clock, Star, CheckCircle, Menu, X } from "lucide-react"
import { useState } from "react"
import { ManualInstall } from "./manual-install"
import Image from "next/image"

interface LandingPageProps {
  onNavigate: (page: string) => void
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                EduBridge
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <div className="flex gap-3 ml-4">
                <ManualInstall />
                <Button
                  variant="ghost"
                  onClick={() => router.push("/login")}
                  className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
                >
                  Login
                </Button>
                <Button
                  onClick={() => router.push("/signup")}
                  className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Sign Up
                </Button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-primary/5 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border/40">
              <div className="flex flex-col gap-3 pt-4">
                <ManualInstall />
                <Button
                  variant="ghost"
                  onClick={() => {
                    router.push("/login")
                    setMobileMenuOpen(false)
                  }}
                  className="justify-start text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    router.push("/signup")
                    setMobileMenuOpen(false)
                  }}
                  className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
        <div className="absolute top-10 sm:top-20 left-5 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-64 h-64 sm:w-96 sm:h-96 bg-secondary/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-left duration-1000 text-center md:text-left">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance leading-tight">
                Learn{" "}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                  Anywhere
                </span>
                . Anytime.{" "}
                <span className="bg-gradient-to-r from-secondary via-secondary/80 to-primary bg-clip-text text-transparent">
                  Together
                </span>
                .
              </h2>

              <p className="text-lg sm:text-xl text-muted-foreground text-balance leading-relaxed">
                Connecting rural and urban students with equal access to quality learning resources, expert tutors, and a
                vibrant global community that never sleeps.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={() => onNavigate("student-dashboard")}
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-200 group"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            <div className="relative animate-in slide-in-from-right duration-1000 delay-300 mt-8 md:mt-0">
              <div className="relative">
                <Image
                  src="/global-learning-platform.png"
                  alt="Global Learning Platform"
                  width={500}
                  height={400}
                  className="w-full h-auto object-contain drop-shadow-2xl rounded-2xl sm:rounded-3xl"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl sm:rounded-3xl"></div>

                {/* Floating Elements - Mobile Optimized */}
                <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-xl border animate-bounce">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="text-xs sm:text-sm font-medium">Course Completed!</span>
                  </div>
                </div>

                <div className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-xl border animate-pulse">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    <span className="text-xs sm:text-sm font-medium">24 students online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative bg-gradient-to-b from-secondary/5 to-background border-y border-border/40 py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/10 rounded-full text-xs sm:text-sm font-medium text-primary mb-4">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              Powerful Features
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                EduBridge
              </span>
              ?
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Experience learning like never before with our cutting-edge platform designed for the modern student.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className="group p-6 sm:p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 border-border/50 hover:border-primary/20 bg-gradient-to-br from-background to-secondary/5"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5"></div>
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-secondary/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-secondary text-primary-foreground p-8 sm:p-12 lg:p-16 text-center border-0 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight px-4">
                Ready to Transform Your{" "}
                <span className="text-white/90">Learning Journey</span>?
              </h3>

              <p className="text-base sm:text-lg lg:text-xl opacity-90 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
                Join thousands of students and educators already using EduBridge to connect, learn, and grow together.
                Start your journey today with our free trial.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8">
                <Button
                  size="lg"
                  onClick={() => onNavigate("student-dashboard")}
                  className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200 group px-6 sm:px-8 py-3 sm:py-4"
                >
                  Start Learning Now
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate("teacher-dashboard")}
                  className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200 group px-6 sm:px-8 py-3 sm:py-4"
                >
                  Become a Teacher
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-gradient-to-b from-muted/20 to-muted/40 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
            <div className="space-y-4 col-span-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <h4 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  EduBridge
                </h4>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Connecting learners globally through innovative education technology and community-driven learning experiences.
              </p>
              <div className="flex gap-3 sm:gap-4 pt-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                  <Users className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4 sm:mb-6">Product</h4>
              <ul className="space-y-2 sm:space-y-3 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() => onNavigate("student-dashboard")}
                    className="hover:text-primary transition-colors hover:translate-x-1 transform duration-200 flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    For Students
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("teacher-dashboard")}
                    className="hover:text-primary transition-colors hover:translate-x-1 transform duration-200 flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    For Teachers
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate("courses")}
                    className="hover:text-primary transition-colors hover:translate-x-1 transform duration-200 flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Course Library
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4 sm:mb-6">Community</h4>
              <ul className="space-y-2 sm:space-y-3 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() => onNavigate("community-forum")}
                    className="hover:text-primary transition-colors hover:translate-x-1 transform duration-200 flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Discussion Forum
                  </button>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors hover:translate-x-1 transform duration-200 flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors hover:translate-x-1 transform duration-200 flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4 sm:mb-6">Legal</h4>
              <ul className="space-y-2 sm:space-y-3 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors hover:translate-x-1 transform duration-200 flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors hover:translate-x-1 transform duration-200 flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors hover:translate-x-1 transform duration-200 flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                © 2025 EduBridge. All rights reserved. Made with ❤️ for learners worldwide.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Users,
    title: "Connect Globally",
    description: "Learn from peers and teachers around the world in a supportive community.",
  },
  {
    icon: BookOpen,
    title: "Rich Content Library",
    description: "Access thousands of courses, tutorials, and learning materials.",
  },
  {
    icon: Zap,
    title: "AI-Powered Tutoring",
    description: "Get personalized help from our AI tutor available 24/7.",
  },
  {
    icon: Globe,
    title: "Equal Access",
    description: "Quality education for rural and urban students alike.",
  },
  {
    icon: Award,
    title: "Certified Learning",
    description: "Earn certificates and badges to showcase your achievements and progress.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description: "Learn at your own pace with self-paced courses and flexible live sessions.",
  },
]
