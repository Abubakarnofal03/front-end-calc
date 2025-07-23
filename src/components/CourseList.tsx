import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Plus, 
  BookOpen, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Play,
  Trash2,
  MoreVertical
} from 'lucide-react'

interface Course {
  id: string
  topic: string
  duration_days: number
  current_level: string
  daily_time: string
  start_date: string
  created_at: string
}

interface CourseListProps {
  onSelectCourse: (courseId: string) => void
  onCreateNew: () => void
}

export function CourseList({ onSelectCourse, onCreateNew }: CourseListProps) {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadCourses()
    }
  }, [user])

  const loadCourses = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('learning_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return
    }

    setDeletingId(courseId)
    try {
      const { error } = await supabase
        .from('learning_plans')
        .delete()
        .eq('id', courseId)

      if (error) throw error
      setCourses(courses.filter(c => c.id !== courseId))
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Failed to delete course. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const calculateProgress = (startDate: string, durationDays: number) => {
    const start = new Date(startDate)
    const today = new Date()
    const daysPassed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const progress = Math.min(Math.max(daysPassed / durationDays, 0), 1)
    return Math.round(progress * 100)
  }

  const getDaysRemaining = (startDate: string, durationDays: number) => {
    const start = new Date(startDate)
    const end = new Date(start.getTime() + (durationDays * 24 * 60 * 60 * 1000))
    const today = new Date()
    const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(daysLeft, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-mono">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono">
            <span className="text-green-400">$</span> my-courses
          </h1>
          <p className="text-gray-400 font-mono text-sm mt-1">
            // Manage your learning journey
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-mono text-sm rounded-md transition-all duration-200 border border-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          <span>new-course()</span>
        </button>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2 font-mono">No courses yet</h3>
          <p className="text-gray-400 font-mono text-sm mb-6">
            Start your learning journey by creating your first course
          </p>
          <button
            onClick={onCreateNew}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-mono text-sm rounded-md transition-all duration-200 border border-blue-500/30 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Course</span>
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => {
            const progress = calculateProgress(course.start_date, course.duration_days)
            const daysRemaining = getDaysRemaining(course.start_date, course.duration_days)
            
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200 group"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white font-mono mb-1 group-hover:text-blue-300 transition-colors">
                        {course.topic}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-400 font-mono">
                        <TrendingUp className="h-3 w-3" />
                        <span>{course.current_level}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => deleteCourse(course.id)}
                        disabled={deletingId === course.id}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        {deletingId === course.id ? (
                          <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-300 mb-2 font-mono">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-gray-400 mb-1">
                        <Calendar className="h-3 w-3" />
                      </div>
                      <div className="text-sm font-bold text-white font-mono">{course.duration_days}</div>
                      <div className="text-xs text-gray-400 font-mono">days total</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-gray-400 mb-1">
                        <Clock className="h-3 w-3" />
                      </div>
                      <div className="text-sm font-bold text-white font-mono">{daysRemaining}</div>
                      <div className="text-xs text-gray-400 font-mono">days left</div>
                    </div>
                  </div>

                  {/* Daily Time */}
                  <div className="mb-6">
                    <div className="text-xs text-gray-400 font-mono mb-1">Daily commitment</div>
                    <div className="text-sm text-white font-mono">{course.daily_time}</div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => onSelectCourse(course.id)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 hover:from-green-600/30 hover:to-blue-600/30 text-green-300 font-mono text-sm rounded-md transition-all duration-200 border border-green-500/30 group-hover:border-green-400/50"
                  >
                    <Play className="h-4 w-4" />
                    <span>continue()</span>
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}