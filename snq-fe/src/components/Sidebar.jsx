import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { getDashboards } from '../utils/api'
import CreateDashboardModal from './CreateDashboardModal'
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
  Zap,
  Link
} from 'lucide-react'

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [dashboards, setDashboards] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetchDashboards()
  }, [])

  useEffect(() => {
    // Navigate to default dashboard if available and we're on a generic dashboard route
    if (dashboards.length > 0 && !isLoading) {
      const defaultDashboard = dashboards.find(dashboard => dashboard.is_default)
      const currentPath = location.pathname
      
      // If we're on /dashboard or /home (generic routes) and there's a default dashboard
      if ((currentPath === '/dashboard' || currentPath === '/home') && defaultDashboard) {
        navigate(`/dashboard/${defaultDashboard.id}`)
      }
    }
  }, [dashboards, isLoading, location.pathname, navigate])

  const fetchDashboards = async () => {
    try {
      setIsLoading(true)
      const data = await getDashboards()
      setDashboards(data)
    } catch (error) {
      console.error('Failed to fetch dashboards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleCreateDashboard = () => {
    setIsModalOpen(true)
  }

  const handleDashboardCreated = () => {
    fetchDashboards() // Refresh the list
  }



  const quickActions = [
    {
      name: 'New Dashboard',
      icon: Plus,
      action: handleCreateDashboard
    },
    {
      name: 'Integrations',
      icon: Link,
      action: () => navigate('/integrations')
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
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : dashboards.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400">No dashboards found</p>
                </div>
              ) : (
                dashboards.map((dashboard) => (
                  <motion.button
                    key={dashboard.id}
                    onClick={() => navigate(`/dashboard/${dashboard.id}`)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(`/dashboard/${dashboard.id}`)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <BarChart3 className={`w-5 h-5 ${isActive(`/dashboard/${dashboard.id}`) ? 'text-white' : 'text-blue-400'}`} />
                    {!isCollapsed && (
                      <motion.div
                        variants={itemVariants}
                        animate={isCollapsed ? "collapsed" : "expanded"}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="font-medium truncate">{dashboard.name}</div>
                        {dashboard.description && (
                          <div className="text-xs text-gray-400 truncate">{dashboard.description}</div>
                        )}
                      </motion.div>
                    )}
                  </motion.button>
                ))
              )}
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
                <img src="https://xsgames.co/randomusers/assets/avatars/male/41.jpg" alt="User Avatar" className="rounded-full" />
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

      {/* Create Dashboard Modal */}
      <CreateDashboardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleDashboardCreated}
      />
    </>
  )
}

export default Sidebar 