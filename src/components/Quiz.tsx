import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { generateQuizQuestions, gradeTheoryAnswer, UserProfile } from '../lib/groq'
import { useAuth } from '../contexts/AuthContext'
import { FormattedContent } from './FormattedContent'
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Trophy,
  Brain,
  Target,
  X
} from 'lucide-react'

interface QuizProps {
  lessonId: string
  lessonTitle: string
  subtopics: string[]
  explanations: string[]
  userProfile?: UserProfile
  onClose: () => void
}

interface QuizQuestion {
  id: string
  question: string
  type: 'mcq' | 'theory'
  options: string[] | null
  correct_answer: string
  explanation?: string
  key_points?: string[]
}

interface QuizResponse {
  questionId: string
  userAnswer: string
  isCorrect: boolean
  score?: number
  feedback?: string
  strengths?: string[]
  improvements?: string[]
}

export function Quiz({ lessonId, lessonTitle, subtopics, explanations, userProfile, onClose }: QuizProps) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<QuizResponse[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    loadOrGenerateQuiz()
  }, [])

  const loadOrGenerateQuiz = async () => {
    try {
      // First, try to load existing quiz questions
      const { data: existingQuestions, error: loadError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('daily_lesson_id', lessonId)

      if (loadError) throw loadError

      if (existingQuestions && existingQuestions.length > 0) {
        setQuestions(existingQuestions)
      } else {
        // Generate new quiz questions
        const quizData = await generateQuizQuestions(lessonTitle, subtopics, explanations, userProfile)
        
        const questionsToInsert = [
          ...quizData.mcq.map(q => ({
            daily_lesson_id: lessonId,
            question: q.question,
            type: 'mcq' as const,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation
          })),
          ...quizData.theory.map(q => ({
            daily_lesson_id: lessonId,
            question: q.question,
            type: 'theory' as const,
            options: null,
            correct_answer: q.correct_answer,
            key_points: q.key_points
          }))
        ]

        const { data: newQuestions, error: insertError } = await supabase
          .from('quiz_questions')
          .insert(questionsToInsert)
          .select()

        if (insertError) throw insertError
        
        // Map the data to include additional fields
        const mappedQuestions = newQuestions.map((q: any, index: number) => ({
          ...q,
          explanation: 'explanation' in questionsToInsert[index] ? (questionsToInsert[index] as any).explanation : undefined,
          key_points: 'key_points' in questionsToInsert[index] ? (questionsToInsert[index] as any).key_points : undefined
        }))
        
        setQuestions(mappedQuestions)
      }
    } catch (error) {
      console.error('Error loading quiz:', error)
      alert('Failed to load quiz. Please try again.')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim() || !user) return

    setSubmitting(true)
    const currentQuestion = questions[currentQuestionIndex]
    
    try {
      let isCorrect = false
      let score = 0
      let feedback = ''
      let strengths: string[] = []
      let improvements: string[] = []

      if (currentQuestion.type === 'mcq') {
        isCorrect = currentAnswer === currentQuestion.correct_answer
        score = isCorrect ? 10 : 0
        feedback = isCorrect 
          ? 'Correct! ' + (currentQuestion.explanation || 'Well done!')
          : `Incorrect. The correct answer is: ${currentQuestion.correct_answer}. ${currentQuestion.explanation || ''}`
      } else {
        // Grade theory answer using AI with key points
        const grading = await gradeTheoryAnswer(
          currentQuestion.question,
          currentAnswer,
          currentQuestion.correct_answer,
          currentQuestion.key_points || []
        )
        score = grading.score
        isCorrect = score >= 7
        feedback = grading.feedback
        strengths = grading.strengths || []
        improvements = grading.improvements || []
      }

      // Save response to database
      await supabase.from('quiz_responses').insert({
        user_id: user.id,
        quiz_question_id: currentQuestion.id,
        user_answer: currentAnswer,
        is_correct: isCorrect,
        score,
        feedback
      })

      // Add to local responses
      const newResponse: QuizResponse = {
        questionId: currentQuestion.id,
        userAnswer: currentAnswer,
        isCorrect,
        score,
        feedback,
        strengths,
        improvements
      }

      setResponses([...responses, newResponse])
      setCurrentAnswer('')

      // Move to next question or show results
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        setShowResults(true)
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      alert('Failed to submit answer. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const calculateResults = () => {
    const totalScore = responses.reduce((sum, r) => sum + (r.score || 0), 0)
    const maxScore = questions.length * 10
    const percentage = Math.round((totalScore / maxScore) * 100)
    const correctAnswers = responses.filter(r => r.isCorrect).length
    
    return { totalScore, maxScore, percentage, correctAnswers }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-mono">Generating quiz...</p>
        </div>
      </div>
    )
  }

  if (showResults) {
    const results = calculateResults()
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Trophy className="h-6 sm:h-8 w-6 sm:w-8 text-yellow-400" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white font-mono">Quiz Results</h2>
                <p className="text-gray-400 text-sm font-mono">{lessonTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Results Summary */}
          <div className="p-4 sm:p-6 border-b border-gray-700">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white font-mono">{results.percentage}%</div>
                <div className="text-xs text-gray-400 font-mono">Score</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white font-mono">{results.correctAnswers}/{questions.length}</div>
                <div className="text-xs text-gray-400 font-mono">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white font-mono">{results.totalScore}</div>
                <div className="text-xs text-gray-400 font-mono">Points</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                  {results.percentage >= 80 ? 'A' : results.percentage >= 70 ? 'B' : results.percentage >= 60 ? 'C' : 'F'}
                </div>
                <div className="text-xs text-gray-400 font-mono">Grade</div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="p-4 sm:p-6 space-y-4">
            {questions.map((question, index) => {
              const response = responses[index]
              return (
                <div key={question.id} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    {response?.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white mb-2 font-mono text-sm sm:text-base">
                        Question {index + 1}: {question.question}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-400 font-mono">Your answer: </span>
                          <span className="text-white font-mono break-words">{response?.userAnswer}</span>
                        </div>
                        {question.type === 'mcq' && !response?.isCorrect && (
                          <div>
                            <span className="text-gray-400 font-mono">Correct answer: </span>
                            <span className="text-green-400 font-mono">{question.correct_answer}</span>
                          </div>
                        )}
                        {response?.feedback && (
                          <div className="mt-2 p-3 bg-gray-800 rounded">
                            <FormattedContent content={response.feedback || ''} className="text-xs" />
                          </div>
                        )}
                        {response?.strengths && response.strengths.length > 0 && (
                          <div className="mt-2">
                            <div className="text-green-400 font-mono text-xs mb-1">Strengths:</div>
                            <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                              {response.strengths.map((strength, i) => (
                                <li key={i}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {response?.improvements && response.improvements.length > 0 && (
                          <div className="mt-2">
                            <div className="text-yellow-400 font-mono text-xs mb-1">Areas for improvement:</div>
                            <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                              {response.improvements.map((improvement, i) => (
                                <li key={i}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {question.type === 'theory' && (
                          <div>
                            <span className="text-gray-400 font-mono">Score: </span>
                            <span className="text-white font-mono">{response?.score}/10</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-mono text-sm rounded-md transition-all duration-200"
            >
              Continue Learning
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Brain className="h-5 sm:h-6 w-5 sm:w-6 text-purple-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-mono">Quiz Mode</h2>
              <p className="text-gray-400 text-sm font-mono">{lessonTitle}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 font-mono">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="px-4 sm:px-6 py-2">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Target className="h-4 sm:h-5 w-4 sm:w-5 text-blue-400" />
              <span className="text-blue-400 font-mono text-sm">
                {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Theory Question'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4 font-mono">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Answer Input */}
          <div className="space-y-4">
            {currentQuestion.type === 'mcq' ? (
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentAnswer(option)}
                    className={`w-full p-3 text-left rounded-md border-2 transition-all duration-200 font-mono text-sm ${
                      currentAnswer === option
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-purple-400 hover:bg-purple-400/10'
                    }`}
                  >
                    <span className="text-purple-400 mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Enter your detailed answer..."
                className="w-full h-32 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 font-mono text-sm resize-none"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-mono text-sm"
            >
              Exit Quiz
            </button>
            
            <button
              onClick={handleAnswerSubmit}
              disabled={!currentAnswer.trim() || submitting}
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono text-sm rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>{currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}