import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { Auth } from './components/Auth'
import { Onboarding } from './components/Onboarding'
import { Dashboard } from './components/Dashboard'
import { CourseList } from './components/CourseList'
import { Profile } from './components/Profile'
import { supabase } from './lib/supabase'

function AppContent() {
  const { user, loading } = useAuth()
  const [hasLearningPlan, setHasLearningPlan] = useState<boolean | null>(null)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      checkUserProfile()
      checkLearningPlan()
    } else {
      setHasLearningPlan(null)
      setHasProfile(null)
      setSelectedCourseId(null)
    }
  }, [user])

  const checkUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error checking user profile:', error)
        setError('Failed to load user profile. Please check your connection.')
        setHasProfile(false)
        return
      }

      setHasProfile(data !== null)
      setError(null)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please refresh the page.')
      setHasProfile(false)
    }
  }

  const checkLearningPlan = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('learning_plans')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (error) {
        console.error('Error checking learning plan:', error)
        setError('Failed to load learning plans. Please check your connection.')
        setHasLearningPlan(false)
        return
      }

      setHasLearningPlan(data && data.length > 0)
      setError(null)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please refresh the page.')
      setHasLearningPlan(false)
    }
  }

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId)
  }

  const handleBackToCourses = () => {
    setSelectedCourseId(null)
  }

  const handleCreateNew = () => {
    setShowOnboarding(true)
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    setHasLearningPlan(true)
    checkLearningPlan()
  }

  const handleShowProfile = () => {
    setShowProfile(true)
  }

  const handleCloseProfile = () => {
    setShowProfile(false)
    // Refresh profile status after closing
    checkUserProfile()
  }

  const handleProfileComplete = () => {
    setShowProfile(false)
    setHasProfile(true)
    checkUserProfile()
  }

  // Show error state if there's a critical error
  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-4">Configuration Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <p className="text-sm text-gray-400">
            Please check your environment variables and try again.
          </p>
        </div>
      </div>
    )
  }

  if (loading || (user && (hasLearningPlan === null || hasProfile === null))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  // If user doesn't have a profile, force them to complete it first
  if (hasProfile === false) {
    return (
      <Layout onShowProfile={handleShowProfile}>
        <Profile onClose={handleProfileComplete} isRequired={true} />
      </Layout>
    )
  }

  return (
    <Layout onShowProfile={handleShowProfile}>
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-md p-4 mb-6 mx-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-400 text-sm">⚠️</span>
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}
      
      {showProfile ? (
        <Profile onClose={handleCloseProfile} />
      ) : showOnboarding ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : selectedCourseId ? (
        <Dashboard 
          courseId={selectedCourseId} 
          onBackToCourses={handleBackToCourses} 
        />
      ) : hasLearningPlan ? (
        <CourseList 
          onSelectCourse={handleSelectCourse}
          onCreateNew={handleCreateNew}
        />
      ) : (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App