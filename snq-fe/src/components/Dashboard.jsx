import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { getDashboardById } from '../utils/api'
import { 
  CheckCircle, 
  Folder, 
  AlertTriangle, 
  Calendar, 
  ChevronUp,
  RefreshCw,
  ChevronDown,
  Loader2
} from 'lucide-react'

const Dashboard = () => {
  const { dashboardId } = useParams()
  const [isLoaded, setIsLoaded] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Fetch dashboard data when dashboardId changes
    if (dashboardId) {
      fetchDashboardData()
    }
  }, [dashboardId])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError('')
      const data = await getDashboardById(dashboardId)
      setDashboardData(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data')
      console.error('Dashboard fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  }

  const progressVariants = {
    hidden: { width: 0 },
    visible: (width) => ({
      width: `${width}%`,
      transition: {
        duration: 1,
        ease: "easeOut",
        delay: 0.5
      }
    })
  }

  const summaryCards = [
    {
      title: 'Tasks Completed',
      value: '47',
      change: '+12%',
      icon: CheckCircle,
      iconColor: 'text-green-400',
      badge: null
    },
    {
      title: 'Active Projects',
      value: '5',
      change: null,
      icon: Folder,
      iconColor: 'text-blue-400',
      badge: '8'
    },
    {
      title: 'Blockers',
      value: '3',
      change: null,
      icon: AlertTriangle,
      iconColor: 'text-orange-400',
      badge: '2'
    },
    {
      title: 'Meetings',
      value: '4',
      change: null,
      icon: Calendar,
      iconColor: 'text-purple-400',
      badge: 'Today'
    }
  ]

  const activeProjects = [
    {
      name: 'PayNow',
      subtitle: 'Payment Platform',
      progress: 74,
      status: 'On Track',
      tasks: '23/31',
      dueDate: 'Jan 25',
      members: 2,
      progressColor: 'bg-blue-400'
    },
    {
      name: 'CRM Dashboard',
      subtitle: 'Customer Management',
      progress: 43,
      status: 'At Risk',
      tasks: '12/28',
      dueDate: 'Jan 30',
      members: 2,
      progressColor: 'bg-orange-400'
    }
  ]

  const recentActivity = [
    {
      text: 'John Doe completed task "API Integration"',
      time: '2 minutes ago',
      dotColor: 'green'
    },
    {
      text: 'Sarah Wilson updated project timeline',
      time: '15 minutes ago',
      dotColor: 'blue'
    },
    {
      text: 'New blocker reported in CRM Dashboard',
      time: '1 hour ago',
      dotColor: 'orange'
    }
  ]

  const todaySchedule = [
    {
      title: 'Sprint Planning',
      description: 'Team meeting for Q1 roadmap',
      time: '9:00 AM',
      dotColor: 'blue'
    },
    {
      title: 'Client Review',
      description: 'PayNow prototype demo',
      time: '2:00 PM',
      dotColor: 'green'
    }
  ]

  const quickActions = [
    {
      title: 'Upload Requirements',
      icon: ChevronUp
    },
    {
      title: 'Sync Confluence',
      icon: RefreshCw
    },
    {
      title: 'Import from Fireflies',
      icon: ChevronDown
    }
  ]

  const integrations = [
    {
      name: 'JIRA',
      icon: '🔺',
      connected: true
    },
    {
      name: 'Confluence',
      icon: '📄',
      connected: true
    },
    {
      name: 'Fireflies',
      icon: '🔥',
      connected: true
    }
  ]



  return (
    <motion.div 
      className="h-full bg-gray-900 p-6"
      variants={containerVariants}
      initial="hidden"
      animate={isLoaded ? "visible" : "hidden"}
    >

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <motion.div
          className="mb-8"
          variants={itemVariants}
        >
          {isLoading ? (
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-100 mb-2">Loading Dashboard...</h1>
                <p className="text-gray-400">Fetching dashboard data</p>
              </div>
            </div>
          ) : error ? (
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">Dashboard Error</h1>
              <p className="text-red-400 mb-2">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-gray-100 mb-2">
                {dashboardData?.name || (dashboardId ? `Dashboard ${dashboardId}` : 'Dashboard')}
              </h1>
              <p className="text-gray-400">
                {dashboardData?.description || (dashboardId ? `Viewing dashboard with ID: ${dashboardId}` : 'Select a dashboard from the sidebar')}
              </p>
              {dashboardData?.is_default && (
                <span className="inline-block mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                  Default Dashboard
                </span>
              )}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary Cards */}
            <motion.div 
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              variants={itemVariants}
            >
              {summaryCards.map((card, index) => (
                <motion.div 
                  key={index} 
                  className="card relative cursor-pointer"
                  variants={cardVariants}
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                >
                  {card.badge && (
                    <motion.div 
                      className="absolute top-2 right-2 text-xs text-gray-400"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      {card.badge}
                    </motion.div>
                  )}
                  <div className="flex items-center space-x-3">
                    <motion.div
                      initial={{ rotate: -180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                    >
                      <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                    </motion.div>
                    <div>
                      <p className="text-sm text-gray-400">{card.title}</p>
                      <motion.p 
                        className="text-2xl font-bold text-gray-100"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.1, type: "spring", stiffness: 200 }}
                      >
                        {card.value}
                      </motion.p>
                      {card.change && (
                        <motion.p 
                          className="text-xs text-green-400"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                        >
                          {card.change}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Active Projects */}
            <motion.div 
              className="card"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold text-gray-100 mb-6">Active Projects</h3>
              <div className="space-y-6">
                {activeProjects.map((project, index) => (
                  <motion.div 
                    key={index} 
                    className="space-y-3 p-4 rounded-lg bg-gray-700/30 border border-gray-600/50 hover:bg-gray-700/50 transition-colors duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.2 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-100">{project.name}</h4>
                        <p className="text-sm text-gray-400">{project.subtitle}</p>
                      </div>
                      <motion.span 
                        className={project.status === 'On Track' ? 'status-on-track' : 'status-at-risk'}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.2, type: "spring" }}
                      >
                        {project.status}
                      </motion.span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="progress-bar">
                        <motion.div 
                          className={`progress-fill ${project.progressColor}`}
                          variants={progressVariants}
                          custom={project.progress}
                          initial="hidden"
                          animate="visible"
                        ></motion.div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">{project.tasks} tasks</span>
                        <span className="text-gray-400">Due: {project.dueDate}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {[...Array(project.members)].map((_, i) => (
                        <motion.div 
                          key={i} 
                          className="w-6 h-6 bg-gray-600 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.7 + index * 0.2 + i * 0.1, type: "spring" }}
                        ></motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div 
              className="card"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold text-gray-100 mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-700/30 transition-colors duration-200"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <motion.div 
                      className={`activity-dot ${activity.dotColor} mt-2`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                    ></motion.div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-200">{activity.text}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <motion.div 
            className="space-y-8"
            variants={itemVariants}
          >
            {/* Today's Schedule */}
            <motion.div 
              className="card"
              variants={cardVariants}
              whileHover="hover"
            >
              <h3 className="text-lg font-semibold text-gray-100 mb-6">Today's Schedule</h3>
              <div className="space-y-4">
                {todaySchedule.map((item, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-700/30 transition-colors duration-200"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    <motion.div 
                      className={`schedule-dot ${item.dotColor} mt-1`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                    ></motion.div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-200">{item.title}</p>
                      <p className="text-xs text-gray-400">{item.description}</p>
                      <p className="text-xs text-gray-500">{item.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              className="card"
              variants={cardVariants}
              whileHover="hover"
            >
              <h3 className="text-lg font-semibold text-gray-100 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <motion.div 
                    key={index} 
                    className="quick-action-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <action.icon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-200">{action.title}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Integrations */}
            <motion.div 
              className="card"
              variants={cardVariants}
              whileHover="hover"
            >
              <h3 className="text-lg font-semibold text-gray-100 mb-6">Integrations</h3>
              <div className="space-y-3">
                {integrations.map((integration, index) => (
                  <motion.div 
                    key={index} 
                    className="integration-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <span className="text-lg">{integration.icon}</span>
                    <span className="text-sm text-gray-200">{integration.name}</span>
                    <motion.div 
                      className="ml-auto w-2 h-2 bg-green-400 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1, type: "spring" }}
                    ></motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>


    </motion.div>
  )
}

export default Dashboard 