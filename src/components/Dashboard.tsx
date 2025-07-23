import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { speakText } from '../lib/tts'
import { askTutorQuestion, getDetailedSubtopicContent, UserProfile } from '../lib/groq'
import { Quiz } from './Quiz'
import { FormattedContent } from './FormattedContent'
import { 
  Terminal, 
  CheckCircle2, 
  Circle, 
  Volume2, 
  Code2,
  Trophy,
  Flame,
  Send,
  Play,
  GitBranch,
  Activity,
  Zap,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  ArrowLeft,
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target,
  Code
} from 'lucide-react'

interface LearningPlan {
  id: string
  topic: string
  duration_days: number
  start_date: string
}

interface DailyLesson {
  id: string
  day_number: number
  title: string
  subtopics: string[]
  explanations: string[]
}

interface Progress {
  day_number: number
  subtopic_index: number
  completed: boolean
}

interface DetailedContent {
  content: string
  keyPoints: string[]
  examples: string[]
  practicalApplications: string[]
}

interface DashboardProps {
  courseId?: string
  onBackToCourses: () => void
}

export function Dashboard({ courseId, onBackToCourses }: DashboardProps) {
  const { user } = useAuth()
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null)
  const [currentLesson, setCurrentLesson] = useState<DailyLesson | null>(null)
  const [progress, setProgress] = useState<Progress[]>([])
  const [currentDay, setCurrentDay] = useState(1)
  const [tutorQuestion, setTutorQuestion] = useState('')
  const [tutorResponse, setTutorResponse] = useState<any>(null)
  const [tutorLoading, setTutorLoading] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [expandedSubtopic, setExpandedSubtopic] = useState<number | null>(null)
  const [detailedContent, setDetailedContent] = useState<{ [key: number]: DetailedContent }>({})
  const [loadingDetails, setLoadingDetails] = useState<{ [key: number]: boolean }>({})
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState({
    streak: 0,
    totalCompleted: 0,
    xp: 0
  })

  useEffect(() => {
    if (user) {
      loadLearningPlan()
      loadStats()
      loadUserProfile()
    }
  }, [user, courseId])

  useEffect(() => {
    if (learningPlan) {
      const startDate = new Date(learningPlan.start_date)
      const today = new Date()
      const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const calculatedDay = Math.min(Math.max(daysDiff + 1, 1), learningPlan.duration_days)
      
      setCurrentDay(calculatedDay)
      loadCurrentLesson(calculatedDay)
      loadProgress()
    }
  }, [learningPlan])

  useEffect(() => {
    if (learningPlan && currentDay) {
      loadCurrentLesson(currentDay)
      loadProgress()
      // Reset expanded state when changing days
      setExpandedSubtopic(null)
      setDetailedContent({})
    }
  }, [currentDay])

  const loadUserProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading user profile:', error)
        return
      }

      if (data) {
        setUserProfile({
          highest_qualification: data.highest_qualification || '',
          specialization: data.specialization || '',
          profession: data.profession || '',
          learning_preferences: data.learning_preferences || {
            includeCode: true,
            preferredExampleTypes: [],
            focusAreas: []
          }
        })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const loadLearningPlan = async () => {
    if (!user) return

    let query = supabase
      .from('learning_plans')
      .select('*')
      .eq('user_id', user.id)

    if (courseId) {
      query = query.eq('id', courseId)
    } else {
      query = query.order('created_at', { ascending: false }).limit(1)
    }

    const { data, error } = await query.single()

    if (error) {
      console.error('Error loading learning plan:', error)
      return
    }

    setLearningPlan(data)
  }

  const loadCurrentLesson = async (day: number) => {
    if (!learningPlan) return

    const { data, error } = await supabase
      .from('daily_lessons')
      .select('*')
      .eq('learning_plan_id', learningPlan.id)
      .eq('day_number', day)
      .single()

    if (error) {
      console.error('Error loading lesson:', error)
      return
    }

    setCurrentLesson(data)
  }

  const loadProgress = async () => {
    if (!user || !learningPlan) return

    const { data, error } = await supabase
      .from('progress_tracker')
      .select('*')
      .eq('user_id', user.id)
      .eq('learning_plan_id', learningPlan.id)

    if (error) {
      console.error('Error loading progress:', error)
      return
    }

    setProgress(data)
  }

  const loadStats = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('progress_tracker')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', true)

    if (error) return

    const totalCompleted = data.length
    const xp = totalCompleted * 10

    // Calculate streak (simplified)
    const streak = Math.floor(Math.random() * 7) + 1 // Placeholder logic

    setStats({ streak, totalCompleted, xp })
  }

  const toggleSubtopicComplete = async (subtopicIndex: number) => {
    if (!user || !learningPlan || !currentLesson) return

    const existingProgress = progress.find(
      p => p.day_number === currentDay && p.subtopic_index === subtopicIndex
    )

    const newCompleted = !existingProgress?.completed

    const { error } = await supabase
      .from('progress_tracker')
      .upsert({
        user_id: user.id,
        learning_plan_id: learningPlan.id,
        day_number: currentDay,
        subtopic_index: subtopicIndex,
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null
      }, {
        onConflict: 'user_id,learning_plan_id,day_number,subtopic_index'
      })

    if (error) {
      console.error('Error updating progress:', error)
      return
    }

    loadProgress()
    loadStats()
  }

  const loadDetailedContent = async (subtopicIndex: number) => {
    if (!currentLesson || !learningPlan || detailedContent[subtopicIndex] || loadingDetails[subtopicIndex]) return

    setLoadingDetails(prev => ({ ...prev, [subtopicIndex]: true }))

    try {
      const detailed = await getDetailedSubtopicContent(
        learningPlan.topic,
        currentLesson.title,
        currentLesson.subtopics[subtopicIndex],
        'intermediate', // You could get this from the learning plan
        userProfile || undefined
      )

      setDetailedContent(prev => ({ ...prev, [subtopicIndex]: detailed }))
    } catch (error) {
      console.error('Error loading detailed content:', error)
    } finally {
      setLoadingDetails(prev => ({ ...prev, [subtopicIndex]: false }))
    }
  }

  const toggleSubtopicExpansion = (subtopicIndex: number) => {
    if (expandedSubtopic === subtopicIndex) {
      setExpandedSubtopic(null)
    } else {
      setExpandedSubtopic(subtopicIndex)
      loadDetailedContent(subtopicIndex)
    }
  }

  const handleTutorQuestion = async () => {
    if (!tutorQuestion.trim() || !currentLesson || tutorLoading) return

    setTutorLoading(true)
    try {
      const context = `
        Day ${currentDay}: ${currentLesson.title}
        Subtopics: ${currentLesson.subtopics.join(', ')}
        Explanations: ${currentLesson.explanations.join('\n\n')}
      `
      
      const response = await askTutorQuestion(context, tutorQuestion, userProfile || undefined)
      setTutorResponse(response)
    } catch (error) {
      console.error('Error asking tutor:', error)
      setTutorResponse({
        answer: 'ERROR: Failed to connect to AI tutor. Please try again.',
        relatedConcepts: [],
        furtherReading: []
      })
    } finally {
      setTutorLoading(false)
    }
  }

  const navigateToDay = (day: number) => {
    if (!learningPlan || day < 1 || day > learningPlan.duration_days) return
    setCurrentDay(day)
  }

  const canNavigatePrev = currentDay > 1
  const canNavigateNext = learningPlan && currentDay < learningPlan.duration_days

  if (!learningPlan || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-mono">Loading learning environment...</p>
        </div>
      </div>
    )
  }

  const completedToday = progress.filter(p => p.day_number === currentDay && p.completed).length
  const totalToday = currentLesson.subtopics.length
  const todayProgress = totalToday > 0 ? (completedToday / totalToday) * 100 : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBackToCourses}
              className="p-2 rounded-md bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors border border-gray-600/50"
              title="Back to Courses"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Terminal className="h-4 sm:h-6 w-4 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white font-mono">
                <span className="text-green-400">$</span> learning/{learningPlan.topic.toLowerCase().replace(/\s+/g, '-')}
              </h1>
              <div className="flex items-center space-x-4 text-xs sm:text-sm text-gray-400 font-mono">
                <div className="flex items-center space-x-1">
                  <GitBranch className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span>day-{currentDay}/{learningPlan.duration_days}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Activity className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span>active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Day Navigation */}
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
            <button
              onClick={() => navigateToDay(1)}
              disabled={currentDay === 1}
              className="p-1.5 sm:p-2 rounded-md bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600/50 flex-shrink-0"
              title="First Day"
            >
              <SkipBack className="h-3 sm:h-4 w-3 sm:w-4" />
            </button>
            <button
              onClick={() => navigateToDay(currentDay - 1)}
              disabled={!canNavigatePrev}
              className="p-1.5 sm:p-2 rounded-md bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600/50 flex-shrink-0"
              title="Previous Day"
            >
              <ChevronLeft className="h-3 sm:h-4 w-3 sm:w-4" />
            </button>
            <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-500/20 rounded-md border border-blue-500/30 text-blue-300 font-mono text-xs sm:text-sm flex-shrink-0">
              Day {currentDay}
            </div>
            <button
              onClick={() => navigateToDay(currentDay + 1)}
              disabled={!canNavigateNext}
              className="p-1.5 sm:p-2 rounded-md bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600/50 flex-shrink-0"
              title="Next Day"
            >
              <ChevronRight className="h-3 sm:h-4 w-3 sm:w-4" />
            </button>
            <button
              onClick={() => navigateToDay(learningPlan.duration_days)}
              disabled={currentDay === learningPlan.duration_days}
              className="p-1.5 sm:p-2 rounded-md bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600/50 flex-shrink-0"
              title="Last Day"
            >
              <SkipForward className="h-3 sm:h-4 w-3 sm:w-4" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg p-3 sm:p-4 border border-gray-700/50">
            <div className="flex items-center space-x-2">
              <Flame className="h-4 sm:h-5 w-4 sm:w-5 text-orange-400" />
              <div>
                <div className="text-sm sm:text-lg font-bold text-white font-mono">{stats.streak}</div>
                <div className="text-xs text-gray-400 font-mono">day streak</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg p-3 sm:p-4 border border-gray-700/50">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-400" />
              <div>
                <div className="text-sm sm:text-lg font-bold text-white font-mono">{stats.xp}</div>
                <div className="text-xs text-gray-400 font-mono">total XP</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg p-3 sm:p-4 border border-gray-700/50">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 sm:h-5 w-4 sm:w-5 text-green-400" />
              <div>
                <div className="text-sm sm:text-lg font-bold text-white font-mono">{completedToday}/{totalToday}</div>
                <div className="text-xs text-gray-400 font-mono">today</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg p-3 sm:p-4 border border-gray-700/50">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 sm:h-5 w-4 sm:w-5 text-blue-400" />
              <div>
                <div className="text-sm sm:text-lg font-bold text-white font-mono">{Math.round(todayProgress)}%</div>
                <div className="text-xs text-gray-400 font-mono">progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Today's Lesson */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-gray-700/50"
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gray-800/50 rounded-t-lg border-b border-gray-700/50">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-2">
                  <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-red-500"></div>
                  <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-gray-400 text-xs sm:text-sm font-mono">~/lessons/day-{currentDay}</span>
              </div>
              <div className="text-gray-400 text-xs sm:text-sm font-mono truncate ml-2">{currentLesson.title}</div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-6">
                {currentLesson.subtopics.map((subtopic, index) => {
                  const isCompleted = progress.find(
                    p => p.day_number === currentDay && p.subtopic_index === index
                  )?.completed || false

                  const isExpanded = expandedSubtopic === index
                  const detailed = detailedContent[index]
                  const isLoadingDetails = loadingDetails[index]

                  return (
                    <div
                      key={index}
                      className={`rounded-lg border-2 transition-all duration-200 ${
                        isCompleted
                          ? 'border-green-500/50 bg-green-500/10'
                          : 'border-gray-600/50 bg-gray-800/30'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start space-x-3">
                          <button
                            onClick={() => toggleSubtopicComplete(index)}
                            className="mt-1 flex-shrink-0"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 sm:h-6 w-5 sm:w-6 text-green-400" />
                            ) : (
                              <Circle className="h-5 sm:h-6 w-5 sm:w-6 text-gray-400 hover:text-white transition-colors" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-white font-mono text-sm sm:text-base">
                                <span className="text-blue-400">[{index + 1}]</span> {subtopic}
                              </h3>
                              <button
                                onClick={() => toggleSubtopicExpansion(index)}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                title={isExpanded ? "Collapse details" : "Expand for detailed content"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            </div>

                            {/* Brief Overview */}
                            <div className="mb-4">
                              <FormattedContent 
                                content={currentLesson.explanations[index] || ''} 
                                className="text-xs sm:text-sm"
                              />
                            </div>

                            {/* Detailed Content */}
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t border-gray-600/50 pt-4 mt-4"
                              >
                                {isLoadingDetails ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-2" />
                                    <span className="text-gray-400 font-mono text-sm">Loading detailed content...</span>
                                  </div>
                                ) : detailed ? (
                                  <div className="space-y-6">
                                    {/* Main Content */}
                                    <div>
                                      <div className="flex items-center space-x-2 mb-3">
                                        <BookOpen className="h-4 w-4 text-purple-400" />
                                        <span className="text-purple-400 font-mono text-sm">Detailed Explanation</span>
                                      </div>
                                      <FormattedContent 
                                        content={detailed.content} 
                                        className="text-sm"
                                      />
                                    </div>

                                    {/* Key Points */}
                                    {detailed.keyPoints && detailed.keyPoints.length > 0 && (
                                      <div>
                                        <div className="flex items-center space-x-2 mb-3">
                                          <Target className="h-4 w-4 text-yellow-400" />
                                          <span className="text-yellow-400 font-mono text-sm">Key Points</span>
                                        </div>
                                        <ul className="space-y-2">
                                          {detailed.keyPoints.map((point, i) => (
                                            <li key={i} className="flex items-start space-x-2">
                                              <span className="text-yellow-400 mt-1">•</span>
                                              <span className="text-gray-300 text-sm">{point}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Examples */}
                                    {detailed.examples && detailed.examples.length > 0 && (
                                      <div>
                                        <div className="flex items-center space-x-2 mb-3">
                                          <Code className="h-4 w-4 text-green-400" />
                                          <span className="text-green-400 font-mono text-sm">Examples</span>
                                        </div>
                                        <div className="space-y-3">
                                          {detailed.examples.map((example, i) => (
                                            <div key={i} className="bg-gray-800/50 rounded-md p-3 border border-gray-600/30">
                                              <FormattedContent 
                                                content={example} 
                                                className="text-sm"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Practical Applications */}
                                    {detailed.practicalApplications && detailed.practicalApplications.length > 0 && (
                                      <div>
                                        <div className="flex items-center space-x-2 mb-3">
                                          <Lightbulb className="h-4 w-4 text-orange-400" />
                                          <span className="text-orange-400 font-mono text-sm">Practical Applications</span>
                                        </div>
                                        <ul className="space-y-2">
                                          {detailed.practicalApplications.map((app, i) => (
                                            <li key={i} className="flex items-start space-x-2">
                                              <span className="text-orange-400 mt-1">→</span>
                                              <span className="text-gray-300 text-sm">{app}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ) : null}
                              </motion.div>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mt-4">
                              <button
                                onClick={() => speakText(currentLesson.explanations[index] || '')}
                                className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-md transition-colors border border-blue-500/30 font-mono text-xs"
                              >
                                <Volume2 className="h-3 w-3" />
                                <span>tts.play()</span>
                              </button>
                              {!isExpanded && (
                                <button
                                  onClick={() => toggleSubtopicExpansion(index)}
                                  className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-md transition-colors border border-purple-500/30 font-mono text-xs"
                                >
                                  <BookOpen className="h-3 w-3" />
                                  <span>learn.more()</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Quiz Button */}
              <div className="mt-8 text-center">
                <button 
                  onClick={() => setShowQuiz(true)}
                  className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono text-xs sm:text-sm rounded-md transition-all duration-200 border border-purple-500/30 mx-auto"
                >
                  <Play className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span>./run-quiz</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-gray-700/50"
          >
            <div className="px-4 py-3 bg-gray-800/50 rounded-t-lg border-b border-gray-700/50">
              <h3 className="text-sm font-bold text-white font-mono">system.status</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-2 font-mono">
                  <span>course.progress</span>
                  <span>{Math.round((currentDay / learningPlan.duration_days) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentDay / learningPlan.duration_days) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-2 font-mono">
                  <span>today.completion</span>
                  <span>{Math.round(todayProgress)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${todayProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* AI Tutor */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-gray-700/50"
          >
            <div className="px-4 py-3 bg-gray-800/50 rounded-t-lg border-b border-gray-700/50">
              <div className="flex items-center space-x-2">
                <Code2 className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white font-mono">ai.tutor</h3>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  placeholder="ask('What is...?')"
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800/50 border border-gray-600/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 font-mono text-xs"
                  onKeyPress={(e) => e.key === 'Enter' && handleTutorQuestion()}
                />
                <button
                  onClick={handleTutorQuestion}
                  disabled={tutorLoading || !tutorQuestion.trim()}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30"
                >
                  {tutorLoading ? (
                    <div className="w-3 sm:w-4 h-3 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="h-3 sm:h-4 w-3 sm:w-4" />
                  )}
                </button>
              </div>

              {tutorResponse && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-500/20 rounded-md border border-purple-500/30">
                    <div className="text-xs text-purple-300 mb-1 font-mono">tutor.response:</div>
                    <FormattedContent 
                      content={tutorResponse.answer || ''} 
                      className="text-xs"
                    />
                  </div>
                  
                  {tutorResponse.relatedConcepts && tutorResponse.relatedConcepts.length > 0 && (
                    <div className="p-3 bg-blue-500/20 rounded-md border border-blue-500/30">
                      <div className="text-xs text-blue-300 mb-2 font-mono">related.concepts:</div>
                      <div className="flex flex-wrap gap-1">
                        {tutorResponse.relatedConcepts.map((concept: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-blue-600/30 rounded text-xs text-blue-200 font-mono">
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quiz Modal */}
      {showQuiz && currentLesson && (
        <Quiz
          lessonId={currentLesson.id}
          lessonTitle={currentLesson.title}
          subtopics={currentLesson.subtopics}
          explanations={currentLesson.explanations}
          userProfile={userProfile || undefined}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </div>
  )
}