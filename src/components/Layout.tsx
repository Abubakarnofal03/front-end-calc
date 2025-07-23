import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Terminal, User, Code2, Activity, Settings } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  onShowProfile?: () => void
}

export function Layout({ children, onShowProfile }: LayoutProps) {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 font-mono">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-pink-900/10" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
      
      {/* Navigation */}
      <nav className="relative z-10 bg-gray-900/90 backdrop-blur-xl border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-md flex items-center justify-center">
                  <Terminal className="h-3 sm:h-5 w-3 sm:w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-white">
                    <span className="text-blue-400">$</span> NeuraLearn
                  </h1>
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Activity className="h-2 sm:h-3 w-2 sm:w-3" />
                    <span>online</span>
                  </div>
                </div>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 bg-gray-800/50 rounded-md border border-gray-700/50">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300 truncate max-w-32">{user.email}</span>
                </div>
                
                {onShowProfile && (
                  <button
                    onClick={onShowProfile}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-md bg-blue-900/20 hover:bg-blue-900/30 text-blue-300 border border-blue-500/30 transition-colors text-xs sm:text-sm"
                    title="Profile Settings"
                  >
                    <Settings className="h-3 sm:h-4 w-3 sm:w-4" />
                    <span className="hidden sm:inline">profile</span>
                  </button>
                )}
                
                <button
                  onClick={signOut}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 rounded-md bg-red-900/20 hover:bg-red-900/30 text-red-300 border border-red-500/30 transition-colors text-xs sm:text-sm"
                >
                  <LogOut className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="hidden sm:inline">exit</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="h-full"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Code2 className="h-3 w-3" />
            <span>Built with React + TypeScript + Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  )
}