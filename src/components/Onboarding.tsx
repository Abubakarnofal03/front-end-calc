import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { generateLearningPlan } from '../lib/groq'
import { Terminal, Clock, TrendingUp, Calendar, ArrowRight, Play, Settings } from 'lucide-react'

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    topic: '',
    duration: 7,
    level: 'beginner',
    dailyTime: '30 minutes'
  })

  const levels = [
    { value: 'beginner', label: 'Beginner', description: 'Starting from scratch', icon: '🌱' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience', icon: '🚀' },
    { value: 'advanced', label: 'Advanced', description: 'Strong foundation', icon: '⚡' }
  ]

  const timeOptions = [
    { value: '15 minutes', label: '15min', desc: 'Quick sessions' },
    { value: '30 minutes', label: '30min', desc: 'Balanced learning' },
    { value: '1 hour', label: '1hr', desc: 'Deep focus' },
    { value: '2 hours', label: '2hr', desc: 'Intensive study' },
    { value: '3+ hours', label: '3hr+', desc: 'Marathon mode' }
  ]

  const handleSubmit = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Generate learning plan using Groq
      const plan = await generateLearningPlan(
        formData.topic,
        formData.duration,
        formData.level,
        formData.dailyTime
      )

      // Save learning plan to Supabase
      const { data: learningPlan, error: planError } = await supabase
        .from('learning_plans')
        .insert({
          user_id: user.id,
          topic: formData.topic,
          duration_days: formData.duration,
          current_level: formData.level,
          daily_time: formData.dailyTime,
          start_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (planError) throw planError

      // Save daily lessons
      for (const day of plan.days) {
        await supabase
          .from('daily_lessons')
          .insert({
            learning_plan_id: learningPlan.id,
            day_number: day.day,
            title: day.title,
            subtopics: day.subtopics,
            explanations: day.explanations
          })
          .select()
          .single()

        // Initialize progress tracking for each subtopic
        for (let i = 0; i < day.subtopics.length; i++) {
          await supabase.from('progress_tracker').insert({
            user_id: user.id,
            learning_plan_id: learningPlan.id,
            day_number: day.day,
            subtopic_index: i,
            completed: false
          })
        }
      }

      onComplete()
    } catch (error) {
      console.error('Error creating learning plan:', error)
      alert('Failed to create learning plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <div className="bg-gray-900/90 backdrop-blur-xl rounded-lg border border-gray-700/50 shadow-2xl">
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-800/50 rounded-t-lg border-b border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-gray-400 text-sm font-mono">~/setup/learning-plan</span>
            </div>
            <div className="text-gray-400 text-sm font-mono">
              [{step}/4] configuring...
            </div>
          </div>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-4 border border-blue-500/30">
                <Settings className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 font-mono">
                <span className="text-green-400">$</span> ./configure-learning-plan
              </h2>
              <p className="text-gray-400 text-sm font-mono">// Initialize your personalized learning environment</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                <span>Progress</span>
                <span>{Math.round((step / 4) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Step 1: Topic */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Terminal className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2 font-mono">
                    <span className="text-green-400">topic</span> = input()
                  </h3>
                  <p className="text-gray-400 font-mono text-sm">// What technology or skill do you want to master?</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                    <span className="text-blue-400">&gt;</span> Enter topic:
                  </label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono"
                    placeholder="React.js, Python, Docker, Machine Learning..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!formData.topic.trim()}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-mono text-sm rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500/30"
                  >
                    <span>next()</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Duration */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2 font-mono">
                    <span className="text-green-400">duration</span> = select_days()
                  </h3>
                  <p className="text-gray-400 font-mono text-sm">// Choose your learning sprint duration</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[3, 7, 14, 21, 30, 60].map((days) => (
                    <button
                      key={days}
                      onClick={() => setFormData({ ...formData, duration: days })}
                      className={`p-4 rounded-md border-2 transition-all duration-200 font-mono ${
                        formData.duration === days
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-gray-600/50 bg-gray-800/30 text-gray-300 hover:border-blue-400/50 hover:bg-blue-400/10'
                      }`}
                    >
                      <div className="text-2xl font-bold">{days}</div>
                      <div className="text-xs text-gray-400">{days === 1 ? 'day' : 'days'}</div>
                    </button>
                  ))}
                  {/* Custom days option */}
                  <div className="col-span-3 flex items-center mt-4">
                    <label className="text-gray-300 font-mono mr-2">Custom:</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={![3,7,14,21,30,60].includes(formData.duration) ? formData.duration : ''}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val)) setFormData({ ...formData, duration: val })
                      }}
                      placeholder="Enter days"
                      className="w-28 px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-mono text-sm"
                  >
                    back()
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-mono text-sm rounded-md transition-all duration-200 border border-blue-500/30"
                    disabled={formData.duration < 1}
                  >
                    <span>next()</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Level */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2 font-mono">
                    <span className="text-green-400">skill_level</span> = assess()
                  </h3>
                  <p className="text-gray-400 font-mono text-sm">// Current proficiency assessment</p>
                </div>
                
                <div className="space-y-4">
                  {levels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setFormData({ ...formData, level: level.value })}
                      className={`w-full p-4 rounded-md border-2 text-left transition-all duration-200 font-mono ${
                        formData.level === level.value
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-gray-600/50 bg-gray-800/30 hover:border-blue-400/50 hover:bg-blue-400/10'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{level.icon}</span>
                        <div>
                          <div className="font-semibold text-white">{level.label}</div>
                          <div className="text-sm text-gray-400">// {level.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-mono text-sm"
                  >
                    back()
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-mono text-sm rounded-md transition-all duration-200 border border-blue-500/30"
                  >
                    <span>next()</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Daily Time */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Clock className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2 font-mono">
                    <span className="text-green-400">daily_time</span> = allocate()
                  </h3>
                  <p className="text-gray-400 font-mono text-sm">// Time allocation per learning session</p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {timeOptions.map((time) => (
                    <button
                      key={time.value}
                      onClick={() => setFormData({ ...formData, dailyTime: time.value })}
                      className={`w-full p-4 rounded-md border-2 text-left transition-all duration-200 font-mono ${
                        formData.dailyTime === time.value
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-gray-600/50 bg-gray-800/30 text-gray-300 hover:border-blue-400/50 hover:bg-blue-400/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold">{time.label}</span>
                          <span className="text-gray-400 ml-2">// {time.desc}</span>
                        </div>
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-mono text-sm"
                  >
                    back()
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-mono text-sm rounded-md transition-all duration-200 border border-blue-500/30"
                  >
                    <span>create_plan()</span>
                    {loading ? <Play className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}