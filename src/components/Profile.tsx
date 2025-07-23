import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  Settings, 
  Save, 
  ArrowLeft,
  Code,
  Stethoscope,
  Calculator,
  PenTool,
  Building,
  Lightbulb,
  BookOpen,
  Target,
  CheckCircle2
} from 'lucide-react'

interface UserProfile {
  id?: string
  user_id: string
  highest_qualification: string
  specialization: string
  profession: string
  learning_preferences: {
    includeCode: boolean
    preferredExampleTypes: string[]
    focusAreas: string[]
  }
}

interface ProfileProps {
  onClose: () => void
  isRequired?: boolean
}

export function Profile({ onClose, isRequired = false }: ProfileProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile>({
    user_id: user?.id || '',
    highest_qualification: '',
    specialization: '',
    profession: '',
    learning_preferences: {
      includeCode: true,
      preferredExampleTypes: [],
      focusAreas: []
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const qualifications = [
    'High School',
    'Associate Degree',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'PhD/Doctorate',
    'Professional Certification',
    'Self-taught',
    'Other'
  ]

  const professions = [
    { value: 'software-developer', label: 'Software Developer', icon: Code, includeCode: true },
    { value: 'data-scientist', label: 'Data Scientist', icon: Calculator, includeCode: true },
    { value: 'healthcare-professional', label: 'Healthcare Professional', icon: Stethoscope, includeCode: false },
    { value: 'business-manager', label: 'Business Manager', icon: Briefcase, includeCode: false },
    { value: 'designer', label: 'Designer', icon: PenTool, includeCode: false },
    { value: 'engineer', label: 'Engineer', icon: Settings, includeCode: true },
    { value: 'educator', label: 'Educator', icon: BookOpen, includeCode: false },
    { value: 'researcher', label: 'Researcher', icon: Lightbulb, includeCode: true },
    { value: 'consultant', label: 'Consultant', icon: Building, includeCode: false },
    { value: 'student', label: 'Student', icon: GraduationCap, includeCode: true },
    { value: 'other', label: 'Other', icon: User, includeCode: true }
  ]

  const exampleTypes = [
    'Real-world case studies',
    'Code examples',
    'Visual diagrams',
    'Step-by-step tutorials',
    'Industry best practices',
    'Practical exercises',
    'Theoretical concepts',
    'Mathematical formulas'
  ]

  const focusAreas = [
    'Practical applications',
    'Theoretical understanding',
    'Industry trends',
    'Best practices',
    'Problem-solving',
    'Innovation',
    'Leadership',
    'Technical skills'
  ]

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (data) {
        setProfile({
          ...data,
          learning_preferences: data.learning_preferences || {
            includeCode: true,
            preferredExampleTypes: [],
            focusAreas: []
          }
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    // Validate required fields
    if (!profile.highest_qualification || !profile.profession) {
      alert('Please fill in all required fields (Highest Qualification and Profession)')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          highest_qualification: profile.highest_qualification,
          specialization: profile.specialization,
          profession: profile.profession,
          learning_preferences: profile.learning_preferences
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      if (isRequired) {
        alert('Profile setup complete! Welcome to NeuraLearn.')
      } else {
        alert('Profile saved successfully!')
      }
      onClose()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleProfessionChange = (professionValue: string) => {
    const selectedProfession = professions.find(p => p.value === professionValue)
    setProfile(prev => ({
      ...prev,
      profession: professionValue,
      learning_preferences: {
        ...prev.learning_preferences,
        includeCode: selectedProfession?.includeCode ?? true
      }
    }))
  }

  const toggleExampleType = (type: string) => {
    setProfile(prev => ({
      ...prev,
      learning_preferences: {
        ...prev.learning_preferences,
        preferredExampleTypes: prev.learning_preferences.preferredExampleTypes.includes(type)
          ? prev.learning_preferences.preferredExampleTypes.filter(t => t !== type)
          : [...prev.learning_preferences.preferredExampleTypes, type]
      }
    }))
  }

  const toggleFocusArea = (area: string) => {
    setProfile(prev => ({
      ...prev,
      learning_preferences: {
        ...prev.learning_preferences,
        focusAreas: prev.learning_preferences.focusAreas.includes(area)
          ? prev.learning_preferences.focusAreas.filter(a => a !== area)
          : [...prev.learning_preferences.focusAreas, area]
      }
    }))
  }

  const isFormValid = profile.highest_qualification && profile.profession

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-mono">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/90 backdrop-blur-xl rounded-lg border border-gray-700/50 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800/50 rounded-t-lg border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-gray-400 text-sm font-mono">~/user/profile</span>
          </div>
          {!isRequired && (
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-3 py-1.5 text-gray-400 hover:text-white transition-colors font-mono text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>back()</span>
            </button>
          )}
        </div>

        <div className="p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-4 border border-blue-500/30">
              {isRequired ? <CheckCircle2 className="h-8 w-8 text-green-400" /> : <User className="h-8 w-8 text-blue-400" />}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-mono">
              <span className="text-green-400">$</span> {isRequired ? 'setup-profile' : 'configure-profile'}
            </h2>
            <p className="text-gray-400 text-sm font-mono">
              {isRequired 
                ? '// Complete your profile to get started with personalized learning'
                : '// Personalize your learning experience'
              }
            </p>
            {isRequired && (
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-md">
                <p className="text-blue-300 text-sm font-mono">
                  Profile setup is required to access the learning platform
                </p>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white font-mono border-b border-gray-700 pb-2">
                <span className="text-blue-400">[1]</span> Basic Information
              </h3>

              {/* Highest Qualification */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 font-mono">
                  <GraduationCap className="h-4 w-4 inline mr-2" />
                  Highest Qualification <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {qualifications.map((qual) => (
                    <button
                      key={qual}
                      onClick={() => setProfile(prev => ({ ...prev, highest_qualification: qual }))}
                      className={`p-3 rounded-md border-2 text-left transition-all duration-200 font-mono text-sm ${
                        profile.highest_qualification === qual
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-gray-600/50 bg-gray-800/30 text-gray-300 hover:border-blue-400/50 hover:bg-blue-400/10'
                      }`}
                    >
                      {qual}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 font-mono">
                  <Target className="h-4 w-4 inline mr-2" />
                  Specialization/Field of Study
                </label>
                <input
                  type="text"
                  value={profile.specialization}
                  onChange={(e) => setProfile(prev => ({ ...prev, specialization: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm"
                  placeholder="e.g., Computer Science, Medicine, Business Administration..."
                />
              </div>

              {/* Profession */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 font-mono">
                  <Briefcase className="h-4 w-4 inline mr-2" />
                  Current Profession <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {professions.map((prof) => {
                    const IconComponent = prof.icon
                    return (
                      <button
                        key={prof.value}
                        onClick={() => handleProfessionChange(prof.value)}
                        className={`p-4 rounded-md border-2 text-left transition-all duration-200 font-mono ${
                          profile.profession === prof.value
                            ? 'border-blue-500 bg-blue-500/20 text-white'
                            : 'border-gray-600/50 bg-gray-800/30 text-gray-300 hover:border-blue-400/50 hover:bg-blue-400/10'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-5 w-5" />
                          <span className="text-sm">{prof.label}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Learning Preferences */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white font-mono border-b border-gray-700 pb-2">
                <span className="text-blue-400">[2]</span> Learning Preferences
              </h3>

              {/* Include Code Examples */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.learning_preferences.includeCode}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      learning_preferences: {
                        ...prev.learning_preferences,
                        includeCode: e.target.checked
                      }
                    }))}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-gray-300 font-mono text-sm">
                    <Code className="h-4 w-4 inline mr-2" />
                    Include code examples and technical snippets in explanations
                  </span>
                </label>
              </div>

              {/* Preferred Example Types */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 font-mono">
                  Preferred Example Types
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {exampleTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleExampleType(type)}
                      className={`p-3 rounded-md border-2 text-left transition-all duration-200 font-mono text-xs ${
                        profile.learning_preferences.preferredExampleTypes.includes(type)
                          ? 'border-green-500 bg-green-500/20 text-white'
                          : 'border-gray-600/50 bg-gray-800/30 text-gray-300 hover:border-green-400/50 hover:bg-green-400/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Areas */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 font-mono">
                  Learning Focus Areas
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {focusAreas.map((area) => (
                    <button
                      key={area}
                      onClick={() => toggleFocusArea(area)}
                      className={`p-3 rounded-md border-2 text-left transition-all duration-200 font-mono text-xs ${
                        profile.learning_preferences.focusAreas.includes(area)
                          ? 'border-purple-500 bg-purple-500/20 text-white'
                          : 'border-gray-600/50 bg-gray-800/30 text-gray-300 hover:border-purple-400/50 hover:bg-purple-400/10'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-700">
              <button
                onClick={handleSave}
                disabled={saving || !isFormValid}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-mono text-sm rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-green-500/30"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{isRequired ? 'complete.setup()' : 'save.profile()'}</span>
                  </>
                )}
              </button>
            </div>

            {!isFormValid && (
              <div className="text-center">
                <p className="text-red-400 text-sm font-mono">
                  * Please fill in all required fields to continue
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}