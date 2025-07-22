import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getIntegrations, getDashboardById } from '../utils/api'
import { 
  Link, 
  Settings, 
  Calendar, 
  Mail, 
  FileText, 
  Users, 
  Zap, 
  CheckCircle, 
  ExternalLink,
  Loader2,
  Search,
  Ticket,
  AlertCircle,
  Clock,
  User
} from 'lucide-react'

const Integrations = () => {
  const [integrations, setIntegrations] = useState([])
  const [filteredIntegrations, setFilteredIntegrations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [connectingIntegration, setConnectingIntegration] = useState(null)
  const [connectedIntegrations, setConnectedIntegrations] = useState([])
  const [widgets, setWidgets] = useState([])
  const [widgetsLoading, setWidgetsLoading] = useState(false)

  useEffect(() => {
    fetchIntegrations()
    loadConnectedIntegrations()
    fetchWidgetsData()
  }, [])

  const fetchWidgetsData = async () => {
    try {
      setWidgetsLoading(true)
      // Fetch the first dashboard to get widgets data
      const dashboardData = await getDashboardById(1)
      if (dashboardData?.widgets) {
        setWidgets(dashboardData.widgets)
      }
    } catch (err) {
      console.error('Failed to fetch widgets data:', err)
    } finally {
      setWidgetsLoading(false)
    }
  }

  const loadConnectedIntegrations = () => {
    try {
      const stored = localStorage.getItem('connected_integrations')
      if (stored) {
        setConnectedIntegrations(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load connected integrations:', error)
    }
  }

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true)
      setError('')
      const data = await getIntegrations()
      // Handle the new API response format with nested integrations
      const integrationsArray = data?.integrations && Array.isArray(data.integrations) 
        ? data.integrations 
        : Array.isArray(data) 
          ? data 
          : []
      setIntegrations(integrationsArray)
      setFilteredIntegrations(integrationsArray)
    } catch (err) {
      setError(err.message || 'Failed to fetch integrations')
      setIntegrations([])
      setFilteredIntegrations([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter integrations based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredIntegrations(integrations)
    } else {
      const filtered = integrations.filter(integration =>
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredIntegrations(filtered)
    }
  }, [searchTerm, integrations])

  // Icon mapping for different integration types
  const getIntegrationIcon = (iconName) => {
    const iconMap = {
      'google': Calendar,
      'slack': Users,
      'github': FileText,
      'jira': Settings,
      'trello': FileText,
      'asana': CheckCircle,
      'notion': FileText,
      'figma': Zap,
      'default': Link
    }
    return iconMap[iconName] || iconMap.default
  }

  // Get widget icon based on widget type and service
  const getWidgetIcon = (widgetType, serviceName) => {
    if (widgetType === 'tickets') return Ticket
    if (serviceName === 'jira') return Settings
    if (serviceName === 'github') return FileText
    if (serviceName === 'slack') return Users
    return Settings
  }



  const handleIntegrationClick = async (integration) => {
    if (integration.connect_url && !connectingIntegration) {
      try {
        setConnectingIntegration(integration.id)
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
        const fullUrl = `${apiBaseUrl}${integration.connect_url}`
        const token = localStorage.getItem('synq_token')
        
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          
          // Check if oauth_url is present in the response
          if (data.url) {
            // Redirect to OAuth URL for authentication
            window.open(data.url, '_blank')
            
            // Add to connected integrations with pending status
            const newConnectedIntegration = {
              id: integration.id,
              name: integration.name,
              connectedAt: new Date().toISOString(),
              status: 'pending',
              oauthUrl: data.oauth_url
            }
            
            const updatedConnected = [...connectedIntegrations, newConnectedIntegration]
            setConnectedIntegrations(updatedConnected)
            localStorage.setItem('connected_integrations', JSON.stringify(updatedConnected))
            
            console.log(`OAuth flow initiated for ${integration.name}`)
          } else {
            // Direct connection without OAuth
            const newConnectedIntegration = {
              id: integration.id,
              name: integration.name,
              connectedAt: new Date().toISOString(),
              status: 'connected'
            }
            
            const updatedConnected = [...connectedIntegrations, newConnectedIntegration]
            setConnectedIntegrations(updatedConnected)
            localStorage.setItem('connected_integrations', JSON.stringify(updatedConnected))
            
            console.log(`Successfully connected to ${integration.name}`)
          }
        } else {
          throw new Error(`Failed to connect: ${response.status}`)
        }
      } catch (error) {
        console.error('Integration connection failed:', error)
        // Show error message (you can add a toast notification here)
      } finally {
        setConnectingIntegration(null)
      }
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
      scale: 1.03,
      y: -8,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  }

  if (isLoading) {
    return (
      <div className="h-full bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-800 rounded-lg w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-800 rounded w-96 animate-pulse"></div>
          </div>

          {/* Search Bar Skeleton */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <div className="h-12 bg-gray-800 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-700 rounded-lg w-10 h-10 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-700 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-6 bg-gray-700 rounded w-12 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Integrations Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gray-700 rounded-xl w-12 h-12 animate-pulse"></div>
                    <div className="h-5 bg-gray-700 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="w-4 h-4 bg-gray-700 rounded animate-pulse"></div>
                </div>
                
                <div className="space-y-2 mb-6">
                  <div className="h-3 bg-gray-700 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                  <div className="h-8 bg-gray-700 rounded-lg w-20 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Settings className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-100 mb-2">Failed to Load Integrations</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchIntegrations}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="h-full bg-gray-900 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          variants={itemVariants}
        >
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Integrations</h1>
          <p className="text-gray-400">
            Connect your favorite tools and services to streamline your workflow
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="mb-8"
          variants={itemVariants}
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          variants={itemVariants}
        >
          <motion.div
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/30 transition-all duration-300"
            variants={cardVariants}
            whileHover="hover"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Link className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Integrations</p>
                <p className="text-2xl font-bold text-gray-100">{integrations.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500/30 transition-all duration-300"
            variants={cardVariants}
            whileHover="hover"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Connected</p>
                <p className="text-2xl font-bold text-gray-100">{connectedIntegrations.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500/30 transition-all duration-300"
            variants={cardVariants}
            whileHover="hover"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Ready to Connect</p>
                <p className="text-2xl font-bold text-gray-100">{integrations.length}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Integrations Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={itemVariants}
        >
          {(filteredIntegrations || []).map((integration, index) => {
            // Check if icon is a URL or icon name
            const isIconUrl = integration.icon && integration.icon.startsWith('http')
            const IconComponent = !isIconUrl ? getIntegrationIcon(integration.icon) : null
            
            return (
              <motion.div
                key={integration.id}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                variants={cardVariants}
                whileHover="hover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleIntegrationClick(integration)}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gray-700 rounded-xl group-hover:bg-blue-600/20 group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
                        {isIconUrl ? (
                          <img 
                            src={integration.icon} 
                            alt={`${integration.name} icon`}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'block'
                            }}
                          />
                        ) : null}
                        {(!isIconUrl || !integration.icon) && (
                          <IconComponent className="w-6 h-6 text-gray-300 group-hover:text-blue-400 transition-colors duration-300" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-100 group-hover:text-white transition-colors duration-300">
                          {integration.name}
                        </h3>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-300" />
                  </div>

                  <p className="text-gray-400 text-sm mb-6 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {integration.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium group-hover:text-gray-400 transition-colors duration-300">
                      {integration.id}
                    </span>
                    {connectingIntegration === integration.id ? (
                      <div className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Connecting...</span>
                      </div>
                    ) : (() => {
                      const connected = connectedIntegrations.find(conn => conn.id === integration.id)
                      if (connected) {
                        if (connected.status === 'pending') {
                          return (
                            <div className="px-4 py-2 bg-yellow-600/10 text-yellow-400 text-sm font-medium rounded-lg flex items-center space-x-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Pending Auth</span>
                            </div>
                          )
                        } else {
                          return (
                            <div className="px-4 py-2 bg-green-600/10 text-green-400 text-sm font-medium rounded-lg flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>Connected</span>
                            </div>
                          )
                        }
                      } else {
                        return (
                          <div className="px-4 py-2 bg-blue-600/10 group-hover:bg-blue-600 text-blue-400 group-hover:text-white text-sm font-medium rounded-lg transition-all duration-300 flex items-center space-x-2">
                            <Link className="w-4 h-4" />
                            <span>Connect</span>
                          </div>
                        )
                      }
                    })()}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Empty State */}
        {(!filteredIntegrations || filteredIntegrations.length === 0) && (
          <motion.div
            className="text-center py-12"
            variants={itemVariants}
          >
            <div className="p-4 bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              {searchTerm ? <Search className="w-8 h-8 text-gray-400" /> : <Settings className="w-8 h-8 text-gray-400" />}
            </div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              {searchTerm ? 'No Integrations Found' : 'No Integrations Available'}
            </h3>
            <p className="text-gray-400">
              {searchTerm 
                ? `No integrations match "${searchTerm}". Try a different search term.`
                : 'Check back later for new integrations.'
              }
            </p>
          </motion.div>
        )}

        {/* Connected Integrations Section */}
        {connectedIntegrations.length > 0 && (
          <motion.div
            className="mt-12"
            variants={itemVariants}
          >
            <h2 className="text-2xl font-bold text-gray-100 mb-6">Connected Integrations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectedIntegrations.map((connected, index) => (
                <motion.div
                  key={connected.id}
                  className={`rounded-xl p-6 border ${
                    connected.status === 'pending' 
                      ? 'bg-yellow-900/20 border-yellow-500/30' 
                      : 'bg-green-900/20 border-green-500/30'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-xl ${
                        connected.status === 'pending' 
                          ? 'bg-yellow-600/20' 
                          : 'bg-green-600/20'
                      }`}>
                        {connected.status === 'pending' ? (
                          <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-100">{connected.name}</h3>
                        <p className={`text-sm ${
                          connected.status === 'pending' 
                            ? 'text-yellow-400' 
                            : 'text-green-400'
                        }`}>
                          {connected.status === 'pending' ? 'Pending Authentication' : 'Connected'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {connected.status === 'pending' 
                      ? 'OAuth authentication required' 
                      : `Connected on ${new Date(connected.connectedAt).toLocaleDateString()}`
                    }
                  </div>
                  {connected.status === 'pending' && connected.oauthUrl && (
                    <button
                      onClick={() => window.open(connected.oauthUrl, '_blank')}
                      className="mt-3 w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Complete Authentication
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active Widgets Section */}
        <motion.div
          className="mt-12"
          variants={itemVariants}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-100">Active Widgets</h2>
            {widgetsLoading && (
              <div className="flex items-center space-x-2 text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading widgets...</span>
              </div>
            )}
          </div>
          
          {widgets.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {widgets.map((widget, index) => {
                const WidgetIcon = getWidgetIcon(widget.widget_type, widget.service_name)
                
                return (
                  <motion.div
                    key={widget.id}
                    className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/30 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-600/20 rounded-xl">
                          <WidgetIcon className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-100 capitalize">
                            {widget.widget_type} Widget
                          </h3>
                          <p className="text-sm text-gray-400 capitalize">
                            {widget.service_name}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        widget.is_active 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {widget.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">No Active Widgets</h3>
              <p className="text-gray-400">
                Connect integrations to see widgets and their data here.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Integrations 