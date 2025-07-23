import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Add better error handling for missing environment variables
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Create a fallback client if environment variables are missing (for development)
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not found. Using fallback configuration.')
    // Return a mock client for development/testing
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        signInWithPassword: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
        update: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) }),
        upsert: () => Promise.resolve({ error: new Error('Supabase not configured') })
      })
    } as any
  }
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()

export type Database = {
  public: {
    Tables: {
      learning_plans: {
        Row: {
          id: string
          user_id: string
          topic: string
          duration_days: number
          current_level: string
          daily_time: string
          start_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic: string
          duration_days: number
          current_level: string
          daily_time: string
          start_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string
          duration_days?: number
          current_level?: string
          daily_time?: string
          start_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      daily_lessons: {
        Row: {
          id: string
          learning_plan_id: string
          day_number: number
          title: string
          subtopics: string[]
          explanations: string[]
          created_at: string
        }
        Insert: {
          id?: string
          learning_plan_id: string
          day_number: number
          title: string
          subtopics: string[]
          explanations: string[]
          created_at?: string
        }
        Update: {
          id?: string
          learning_plan_id?: string
          day_number?: number
          title?: string
          subtopics?: string[]
          explanations?: string[]
          created_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          daily_lesson_id: string
          question: string
          type: 'mcq' | 'theory'
          options: string[] | null
          correct_answer: string
          explanation: string | null
          key_points: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          daily_lesson_id: string
          question: string
          type: 'mcq' | 'theory'
          options?: string[] | null
          correct_answer: string
          explanation?: string | null
          key_points?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          daily_lesson_id?: string
          question?: string
          type?: 'mcq' | 'theory'
          options?: string[] | null
          correct_answer?: string
          explanation?: string | null
          key_points?: string[] | null
          created_at?: string
        }
      }
      quiz_responses: {
        Row: {
          id: string
          user_id: string
          quiz_question_id: string
          user_answer: string
          is_correct: boolean
          score: number | null
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_question_id: string
          user_answer: string
          is_correct: boolean
          score?: number | null
          feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quiz_question_id?: string
          user_answer?: string
          is_correct?: boolean
          score?: number | null
          feedback?: string | null
          created_at?: string
        }
      }
      progress_tracker: {
        Row: {
          id: string
          user_id: string
          learning_plan_id: string
          day_number: number
          subtopic_index: number
          completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          learning_plan_id: string
          day_number: number
          subtopic_index: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          learning_plan_id?: string
          day_number?: number
          subtopic_index?: number
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          highest_qualification: string
          specialization: string
          profession: string
          learning_preferences: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          highest_qualification?: string
          specialization?: string
          profession?: string
          learning_preferences?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          highest_qualification?: string
          specialization?: string
          profession?: string
          learning_preferences?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}