import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  Folder, 
  AlertTriangle, 
  Calendar, 
  BarChart3, 
  Settings, 
  Bell,
  User,
  Clock,
  Target,
  TrendingUp,
  Filter,
  Volume2,
  ChevronUp,
  RefreshCw,
  ChevronDown,
  Hash,
  FileText,
  Leaf,
  Type,
  Search,
  Link,
  Clipboard,
  Code,
  LogOut
} from 'lucide-react'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoaded, setIsLoaded] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
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

  const bottomBarIcons = [
    { icon: Hash, label: 'Hash' },
    { icon: FileText, label: 'Document' },
    { icon: Leaf, label: 'Leaf' },
    { icon: Type, label: 'Text' },
    { icon: Search, label: 'Search' },
    { icon: Link, label: 'Link' },
    { icon: Clipboard, label: 'Clipboard' },
    { icon: Code, label: 'Code' }
  ]

  return (
    <motion.div 
      className="min-h-screen bg-gray-900"
      variants={containerVariants}
      initial="hidden"
      animate={isLoaded ? "visible" : "hidden"}
    >
      {/* Sidebar */}
      <motion.aside 
        className="fixed left-0 top-0 h-full w-64 bg-gray-800 border-r border-gray-700 z-50"
        variants={itemVariants}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center space-x-3 p-6 border-b border-gray-700">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-100">Synq</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <motion.button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </motion.button>

            <motion.button 
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                activeTab === 'projects' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Folder className="w-5 h-5" />
              <span className="font-medium">Projects</span>
            </motion.button>

            <motion.button 
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                activeTab === 'analytics' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Analytics</span>
            </motion.button>

            <motion.button 
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                activeTab === 'tasks' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Tasks</span>
            </motion.button>

            <motion.button 
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                activeTab === 'calendar' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Calendar</span>
            </motion.button>

            <motion.button 
              onClick={() => setActiveTab('integrations')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                activeTab === 'integrations' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-gray-100'
              }`}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link className="w-5 h-5" />
              <span className="font-medium">Integrations</span>
            </motion.button>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700/50">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-100 truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <motion.button 
                onClick={handleLogout}
                className="p-1 text-gray-400 hover:text-gray-200 transition-colors duration-200"
                title="Logout"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Top Bar */}
      <motion.div 
        className="fixed top-0 left-64 right-0 h-16 bg-gray-800 border-b border-gray-700 z-40"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-100 capitalize">{activeTab}</h2>
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-sm">Welcome back, {user?.name}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.button 
              className="btn-primary flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Volume2 className="w-4 h-4" />
              <span>Live Mode</span>
            </motion.button>
            <motion.button 
              className="relative p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell className="w-5 h-5" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="ml-64 pt-16"
        variants={itemVariants}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            variants={itemVariants}
          >
            {/* Left Column */}
            <motion.div 
              className="lg:col-span-2 space-y-8"
              variants={itemVariants}
            >
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
          </motion.div>

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
        </motion.div>
        </div>
      </motion.div>

      {/* Bottom Bar */}
      <motion.div 
        className="fixed bottom-0 left-64 right-0 bg-gray-800 border-t border-gray-700"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-center space-x-8">
            {bottomBarIcons.map((item, index) => (
              <motion.button 
                key={index} 
                className="p-2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
              >
                <item.icon className="w-5 h-5" />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard 