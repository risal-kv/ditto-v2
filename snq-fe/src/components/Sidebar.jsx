import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target,
  BarChart3,
  Folder,
  TrendingUp,
  Calendar,
  Settings,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Search,
  Plus,
  MessageSquare,
  FileText,
  Users,
  Zap
} from 'lucide-react'

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      color: 'text-blue-400'
    },
    {
      name: 'Projects',
      icon: Folder,
      path: '/projects',
      color: 'text-green-400'
    },
    {
      name: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      color: 'text-purple-400'
    },
    {
      name: 'Tasks',
      icon: FileText,
      path: '/tasks',
      color: 'text-orange-400'
    },
    {
      name: 'Team',
      icon: Users,
      path: '/team',
      color: 'text-pink-400'
    },
    {
      name: 'Calendar',
      icon: Calendar,
      path: '/calendar',
      color: 'text-indigo-400'
    },
    {
      name: 'Messages',
      icon: MessageSquare,
      path: '/messages',
      color: 'text-cyan-400'
    }
  ]

  const quickActions = [
    {
      name: 'New Project',
      icon: Plus,
      action: () => console.log('New Project')
    },
    {
      name: 'Search',
      icon: Search,
      action: () => console.log('Search')
    },
    {
      name: 'Quick Actions',
      icon: Zap,
      action: () => console.log('Quick Actions')
    }
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  const sidebarVariants = {
    expanded: {
      width: 280,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    collapsed: {
      width: 80,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  }

  const itemVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.2 }
    },
    collapsed: {
      opacity: 0,
      x: -10,
      transition: { duration: 0.2 }
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-gray-800 rounded-lg text-gray-300 hover:text-white transition-colors"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
        className={`fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-700 z-30 lg:relative lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <motion.div 
              className="flex items-center space-x-3"
              variants={itemVariants}
              animate={isCollapsed ? "collapsed" : "expanded"}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <h1 className="text-xl font-bold text-gray-100">Synq</h1>
              )}
            </motion.div>
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1 text-gray-400 hover:text-gray-200 transition-colors"
            >
              {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-2">
              {navigationItems.map((item) => (
                <motion.button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-white' : item.color}`} />
                  {!isCollapsed && (
                    <motion.span
                      variants={itemVariants}
                      animate={isCollapsed ? "collapsed" : "expanded"}
                      className="font-medium"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="px-3 mt-6">
              <motion.div
                variants={itemVariants}
                animate={isCollapsed ? "collapsed" : "expanded"}
                className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
              >
                Quick Actions
              </motion.div>
              <div className="space-y-2">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.name}
                    onClick={action.action}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <action.icon className="w-5 h-5 text-gray-400" />
                    {!isCollapsed && (
                      <motion.span
                        variants={itemVariants}
                        animate={isCollapsed ? "collapsed" : "expanded"}
                        className="text-sm"
                      >
                        {action.name}
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-300" />
              </div>
              {!isCollapsed && (
                <motion.div
                  variants={itemVariants}
                  animate={isCollapsed ? "collapsed" : "expanded"}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email || 'user@synq.com'}
                  </p>
                </motion.div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-4 h-4" />
                {!isCollapsed && (
                  <motion.span
                    variants={itemVariants}
                    animate={isCollapsed ? "collapsed" : "expanded"}
                    className="text-sm"
                  >
                    Logout
                  </motion.span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default Sidebar 