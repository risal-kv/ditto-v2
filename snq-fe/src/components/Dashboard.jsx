import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { getDashboardById, updateDashboardNotes } from '../utils/api'
import { 
  CheckCircle, 
  Folder, 
  AlertTriangle, 
  Calendar, 
  ChevronUp,
  RefreshCw,
  ChevronDown,
  Loader2,
  Mic,
  MicOff,
  Save,
  X,
  Volume2,
  FileText,
  Ticket,
  Circle,
  Minus,
  ExternalLink,
  Tag,
  Pin,
  GitPullRequest,
  GitBranch,
  MessageSquare,
  Clock,
  User,
  TrendingUp,
  Activity,
  Plus,
  Settings,
  Bell,
  Search,
  Filter,
  MoreVertical,
  ArrowUpRight,
  Clock as ClockIcon,
  Star,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Download,
  Upload,
} from 'lucide-react'

const Dashboard = () => {
  const { dashboardId } = useParams()
  const [isLoaded, setIsLoaded] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [transcription, setTranscription] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [showVoiceBot, setShowVoiceBot] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [notes, setNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [syncingConfluence, setSyncingConfluence] = useState(false)
  const [syncingFireflies, setSyncingFireflies] = useState(false)
  const [uploadingRequirements, setUploadingRequirements] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [dashboardNoteTitle, setDashboardNoteTitle] = useState('')
  const [allNotes, setAllNotes] = useState([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)

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

  useEffect(() => {
    // Fetch all notes when component mounts
    fetchAllNotes()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError('')
      const data = await getDashboardById(dashboardId)
      setDashboardData(data)
      // Load existing notes if available
      if (data?.notes) {
        setNotes(data.notes)
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data')
      console.error('Dashboard fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllNotes = async () => {
    try {
      setIsLoadingNotes(true)
      const response = await fetch('https://evident-upward-mudfish.ngrok-free.app/notes/', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('synq_token')}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const notesData = await response.json()
      setAllNotes(notesData)
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setIsLoadingNotes(false)
    }
  }

  // Voice Bot Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []

      recorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setShowVoiceBot(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Unable to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async () => {
    if (!audioBlob) return

    try {
      setIsTranscribing(true)
      
      // Check if API key is available
      const apiKey = import.meta.env.VITE_ASSEMBLY_AI_KEY
      if (!apiKey || apiKey === 'your-assembly-ai-key') {
        // Fallback to mock transcription for testing
        console.log('Using mock transcription (no API key configured)')
        setTimeout(() => {
          setTranscription('This is a mock transcription. Please configure your Assembly AI API key for real transcription.')
          setIsTranscribing(false)
        }, 2000)
        return
      }

      // First, upload the audio file to Assembly AI
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/octet-stream'
        },
        body: audioBlob
      })

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json().catch(() => ({}))
        console.error('Upload Error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.error || uploadResponse.statusText}`)
      }

      const uploadData = await uploadResponse.json()
      console.log('Audio uploaded:', uploadData)

      // Now create transcription request
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: uploadData.upload_url,
          language_code: 'en',
          punctuate: true,
          format_text: true
        })
      })

      if (!transcriptResponse.ok) {
        const errorData = await transcriptResponse.json().catch(() => ({}))
        console.error('Assembly AI API Error:', errorData)
        throw new Error(`Transcription failed: ${errorData.error || transcriptResponse.statusText}`)
      }

      const data = await transcriptResponse.json()
      console.log('Transcription submitted:', data)
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${data.id}`, {
            headers: {
              'Authorization': apiKey
            }
          })
          
          if (!pollResponse.ok) {
            clearInterval(pollInterval)
            throw new Error('Failed to check transcription status')
          }
          
          const pollData = await pollResponse.json()
          console.log('Poll status:', pollData.status)
          
          if (pollData.status === 'completed') {
            clearInterval(pollInterval)
            setTranscription(pollData.text)
            setIsTranscribing(false)
          } else if (pollData.status === 'error') {
            clearInterval(pollInterval)
            throw new Error(`Transcription failed: ${pollData.error || 'Unknown error'}`)
          }
        } catch (pollError) {
          clearInterval(pollInterval)
          console.error('Polling error:', pollError)
          setIsTranscribing(false)
          alert('Failed to check transcription status. Please try again.')
        }
      }, 2000) // Poll every 2 seconds
      
      // Timeout after 60 seconds
      setTimeout(() => {
        clearInterval(pollInterval)
        setIsTranscribing(false)
        alert('Transcription timed out. Please try again.')
      }, 60000)
    } catch (error) {
      console.error('Transcription error:', error)
      setIsTranscribing(false)
      alert(error.message || 'Transcription failed. Please try again.')
    }
  }

  const saveNotes = async () => {
    try {
      // Validate title is provided
      if (!noteTitle.trim()) {
        alert('Please enter a title for your note.')
        return
      }

      setIsSavingNotes(true)
      
      // Prepare the content with transcription if available
      const content = transcription ? `${transcription}\n\n${notes}` : notes
      
      // Call the notes API
      const response = await fetch('https://evident-upward-mudfish.ngrok-free.app/notes/', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('synq_token')}`
        },
        body: JSON.stringify({
          title: noteTitle.trim(),
          content: content.trim(),
          is_pinned: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const savedNote = await response.json()
      console.log('Note saved successfully:', savedNote)
      
      // Reset form and refresh notes
      setNoteTitle('')
      setTranscription('')
      setAudioBlob(null)
      setShowVoiceBot(false)
      fetchAllNotes() // Refresh the notes list
      
      alert('Note saved successfully!')
    } catch (error) {
      console.error('Error saving notes:', error)
      alert(`Failed to save notes: ${error.message}`)
    } finally {
      setIsSavingNotes(false)
    }
  }

  const saveDashboardNotes = async () => {
    try {
      // Validate title is provided
      if (!dashboardNoteTitle.trim()) {
        alert('Please enter a title for your note.')
        return
      }

      setIsSavingNotes(true)
      
      // Call the notes API
      const response = await fetch('https://evident-upward-mudfish.ngrok-free.app/notes/', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('synq_token')}`
        },
        body: JSON.stringify({
          title: dashboardNoteTitle.trim(),
          content: notes.trim(),
          is_pinned: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const savedNote = await response.json()
      console.log('Dashboard note saved successfully:', savedNote)
      
      // Reset form and refresh notes
      setDashboardNoteTitle('')
      setNotes('')
      fetchAllNotes() // Refresh the notes list
      
      alert('Note saved successfully!')
    } catch (error) {
      console.error('Error saving dashboard notes:', error)
      alert(`Failed to save notes: ${error.message}`)
    } finally {
      setIsSavingNotes(false)
    }
  }

  const closeVoiceBot = () => {
    if (isRecording) {
      stopRecording()
    }
    setShowVoiceBot(false)
    setTranscription('')
    setAudioBlob(null)
    setNoteTitle('')
  }

  // Sync Functions
  const handleSyncConfluence = async () => {
    try {
      setSyncingConfluence(true)
      const projectName = dashboardData?.name || 'Default Project'
      
      // Simulate API call to sync Confluence
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log(`Syncing Confluence for project: ${projectName}`)
      alert(`Successfully synced Confluence for project: ${projectName}`)
    } catch (error) {
      console.error('Confluence sync error:', error)
      alert('Failed to sync Confluence. Please try again.')
    } finally {
      setSyncingConfluence(false)
    }
  }

  const handleSyncFireflies = async () => {
    try {
      setSyncingFireflies(true)
      const projectName = dashboardData?.name || 'Default Project'
      
      // Simulate API call to sync Fireflies
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log(`Syncing Fireflies for project: ${projectName}`)
      alert(`Successfully synced Fireflies for project: ${projectName}`)
    } catch (error) {
      console.error('Fireflies sync error:', error)
      alert('Failed to sync Fireflies. Please try again.')
    } finally {
      setSyncingFireflies(false)
    }
  }

  const handleUploadRequirements = async () => {
    try {
      setUploadingRequirements(true)
      const projectName = dashboardData?.name || 'Default Project'
      
      // Simulate API call to upload requirements
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log(`Uploading requirements for project: ${projectName}`)
      alert(`Successfully uploaded requirements for project: ${projectName}`)
    } catch (error) {
      console.error('Requirements upload error:', error)
      alert('Failed to upload requirements. Please try again.')
    } finally {
      setUploadingRequirements(false)
    }
  }

  // Widget Helper Functions
  const getWidgetIcon = (widgetType) => {
    switch (widgetType) {
      case 'tickets':
        return <Ticket className="w-5 h-5" />
      case 'pull_requests':
        return <GitPullRequest className="w-5 h-5" />
      case 'issues':
        return <AlertTriangle className="w-5 h-5" />
      case 'notes_list':
        return <FileText className="w-5 h-5" />
      case 'calendar':
        return <Calendar className="w-5 h-5" />
      default:
        return <Activity className="w-5 h-5" />
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return <Circle className="w-3 h-3 text-green-400" />
      case 'closed':
        return <CheckCircle className="w-3 h-3 text-gray-400" />
      case 'merged':
        return <CheckCircle className="w-3 h-3 text-blue-400" />
      case 'to do':
        return <Circle className="w-3 h-3 text-gray-400" />
      case 'in progress':
        return <Minus className="w-3 h-3 text-yellow-400" />
      case 'done':
        return <CheckCircle className="w-3 h-3 text-green-400" />
      default:
        return <Circle className="w-3 h-3 text-gray-400" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-400 bg-red-400/10'
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'low':
        return 'text-green-400 bg-green-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'text-green-400 bg-green-400/10'
      case 'closed':
        return 'text-gray-400 bg-gray-400/10'
      case 'merged':
        return 'text-blue-400 bg-blue-400/10'
      case 'to do':
        return 'text-gray-400 bg-gray-400/10'
      case 'in progress':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'done':
        return 'text-green-400 bg-green-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    })
  }

  const isAllDayEvent = (startTime, endTime) => {
    if (!startTime || !endTime) return false
    const start = new Date(startTime)
    const end = new Date(endTime)
    const startHours = start.getHours()
    const endHours = end.getHours()
    return startHours === 0 && endHours === 23
  }

  const getEventColor = (event) => {
    const title = event.title?.toLowerCase() || ''
    if (title.includes('standup') || title.includes('meeting')) {
      return 'bg-blue-400/20 text-blue-300 border-blue-400/30'
    }
    if (title.includes('holiday')) {
      return 'bg-red-400/20 text-red-300 border-red-400/30'
    }
    if (title.includes('home')) {
      return 'bg-green-400/20 text-green-300 border-green-400/30'
    }
    if (title.includes('office')) {
      return 'bg-purple-400/20 text-purple-300 border-purple-400/30'
    }
    return 'bg-gray-400/20 text-gray-300 border-gray-400/30'
  }

  const renderTicketsWidget = (widget) => {
    const tickets = widget.data?.tickets || []
    
    return (
      <motion.div
        className="card"
        variants={cardVariants}
        whileHover="hover"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getWidgetIcon(widget.widget_type)}
            <h3 className="text-lg font-semibold text-gray-100">Jira Tickets</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">{tickets.length} tickets</span>
            <div className={`w-2 h-2 rounded-full ${widget.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
          </div>
        </div>
        
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <motion.div
              key={ticket.id}
              className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(ticket.status)}
                  <span className="font-medium text-gray-100">{ticket.key}</span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
              <h4 className="text-sm text-gray-200 mb-2">{ticket.title}</h4>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{ticket.assignee}</span>
                </div>
                <span>{formatDate(ticket.updated_at)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    )
  }

  const renderPullRequestsWidget = (widget) => {
    const pullRequests = widget.data?.pull_requests || []
    
    return (
      <motion.div
        className="card"
        variants={cardVariants}
        whileHover="hover"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getWidgetIcon(widget.widget_type)}
            <h3 className="text-lg font-semibold text-gray-100">Pull Requests</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">{pullRequests.length} PRs</span>
            <div className={`w-2 h-2 rounded-full ${widget.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
          </div>
        </div>
        
        <div className="space-y-3">
          {pullRequests.slice(0, 5).map((pr) => (
            <motion.div
              key={pr.id}
              className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(pr.state)}
                  <span className="font-medium text-gray-100">#{pr.id}</span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(pr.state)}`}>
                  {pr.state}
                </span>
              </div>
              <h4 className="text-sm text-gray-200 mb-2 line-clamp-2">{pr.title}</h4>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{pr.author}</span>
                </div>
                <span>{formatDate(pr.updated_at)}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {pr.repository}
              </div>
            </motion.div>
          ))}
          {pullRequests.length > 5 && (
            <div className="text-center text-sm text-gray-400">
              +{pullRequests.length - 5} more pull requests
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const renderIssuesWidget = (widget) => {
    const issues = widget.data?.issues || []
    
    return (
      <motion.div
        className="card"
        variants={cardVariants}
        whileHover="hover"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getWidgetIcon(widget.widget_type)}
            <h3 className="text-lg font-semibold text-gray-100">GitHub Issues</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">{issues.length} issues</span>
            <div className={`w-2 h-2 rounded-full ${widget.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
          </div>
        </div>
        
        <div className="space-y-3">
          {issues.slice(0, 5).map((issue) => (
            <motion.div
              key={issue.id}
              className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(issue.state)}
                  <span className="font-medium text-gray-100">#{issue.id}</span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(issue.state)}`}>
                  {issue.state}
                </span>
              </div>
              <h4 className="text-sm text-gray-200 mb-2 line-clamp-2">{issue.title}</h4>
              {issue.labels && issue.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {issue.labels.slice(0, 3).map((label, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-400/20 text-blue-300 rounded-full"
                    >
                      {label}
                    </span>
                  ))}
                  {issue.labels.length > 3 && (
                    <span className="px-2 py-1 text-xs text-gray-400">
                      +{issue.labels.length - 3}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{issue.repository}</span>
                <span>{formatDate(issue.updated_at)}</span>
              </div>
            </motion.div>
          ))}
          {issues.length > 5 && (
            <div className="text-center text-sm text-gray-400">
              +{issues.length - 5} more issues
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const renderNotesListWidget = (widget) => {
    const notes = widget.data?.notes || []
    
    return (
      <motion.div
        className="card"
        variants={cardVariants}
        whileHover="hover"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getWidgetIcon(widget.widget_type)}
            <h3 className="text-lg font-semibold text-gray-100">Notes</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">{notes.length} notes</span>
            <div className={`w-2 h-2 rounded-full ${widget.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
          </div>
        </div>
        
        <div className="space-y-3">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30 hover:bg-gray-700/50 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {note.is_pinned ? <Pin className="w-3 h-3 text-yellow-400" /> : <FileText className="w-3 h-3 text-gray-400" />}
                  <span className="font-medium text-gray-100">{note.title}</span>
                </div>
                {note.is_pinned && (
                  <span className="px-2 py-1 text-xs bg-yellow-400/20 text-yellow-300 rounded-full">
                    Pinned
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-300 mb-2 line-clamp-3">{note.content}</p>
              <div className="text-xs text-gray-400">
                {formatDate(note.updated_at)}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    )
  }

  const renderCalendarWidget = (widget) => {
    const events = widget.data?.events || []
    
    // Group events by date
    const eventsByDate = events.reduce((acc, event) => {
      const startDate = new Date(event.start_time)
      const dateKey = startDate.toDateString()
      
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(event)
      return acc
    }, {})

    // Sort dates and get upcoming events (next 7 days)
    const sortedDates = Object.keys(eventsByDate).sort()
    const today = new Date()
    const upcomingDates = sortedDates.filter(dateStr => {
      const date = new Date(dateStr)
      const diffTime = date.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= -1 && diffDays <= 7 // Include today and next 7 days
    })

    return (
      <motion.div
        className="card"
        variants={cardVariants}
        whileHover="hover"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getWidgetIcon(widget.widget_type)}
            <h3 className="text-lg font-semibold text-gray-100">Google Calendar</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">{events.length} events</span>
            <div className={`w-2 h-2 rounded-full ${widget.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
          </div>
        </div>
        
        <div className="space-y-4">
          {upcomingDates.slice(0, 5).map((dateStr) => {
            const date = new Date(dateStr)
            const dayEvents = eventsByDate[dateStr]
            
            return (
              <motion.div
                key={dateStr}
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className="text-sm font-medium text-gray-300">
                    {date.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  {date.toDateString() === today.toDateString() && (
                    <span className="px-2 py-1 text-xs bg-blue-400/20 text-blue-300 rounded-full">
                      Today
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      className={`p-3 rounded-lg border ${getEventColor(event)} hover:opacity-80 transition-opacity`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium line-clamp-1">{event.title}</h4>
                        {isAllDayEvent(event.start_time, event.end_time) && (
                          <span className="px-2 py-1 text-xs bg-gray-400/20 text-gray-300 rounded-full ml-2">
                            All Day
                          </span>
                        )}
                      </div>
                      
                      {!isAllDayEvent(event.start_time, event.end_time) && (
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatTime(event.start_time)} - {formatTime(event.end_time)}
                          </span>
                        </div>
                      )}
                      
                      {event.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      
                      {event.location && (
                        <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                          <span>📍</span>
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )
          })}
          
          {upcomingDates.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No upcoming events</p>
              <p className="text-sm text-gray-500">Check back later for new events</p>
            </div>
          )}
          
          {upcomingDates.length > 5 && (
            <div className="text-center text-sm text-gray-400">
              +{upcomingDates.length - 5} more days with events
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const renderWidget = (widget) => {
    switch (widget.widget_type) {
      case 'tickets':
        return renderTicketsWidget(widget)
      case 'pull_requests':
        return renderPullRequestsWidget(widget)
      case 'issues':
        return renderIssuesWidget(widget)
      case 'notes_list':
        return renderNotesListWidget(widget)
      case 'calendar':
        return renderCalendarWidget(widget)
      default:
        return (
          <motion.div
            className="card"
            variants={cardVariants}
            whileHover="hover"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getWidgetIcon(widget.widget_type)}
                <h3 className="text-lg font-semibold text-gray-100">
                  {widget.widget_type.replace('_', ' ').toUpperCase()}
                </h3>
              </div>
              <div className={`w-2 h-2 rounded-full ${widget.is_active ? 'bg-green-400' : 'bg-gray-400'}`} />
            </div>
            <p className="text-gray-400">Widget type not implemented yet</p>
          </motion.div>
        )
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
      subtitle: dashboardData?.name || 'Default Project',
      icon: ChevronUp,
      action: handleUploadRequirements,
      loading: uploadingRequirements
    },
    {
      title: 'Sync Confluence',
      subtitle: dashboardData?.name || 'Default Project',
      icon: RefreshCw,
      action: handleSyncConfluence,
      loading: syncingConfluence
    },
    {
      title: 'Import from Fireflies',
      subtitle: dashboardData?.name || 'Default Project',
      icon: ChevronDown,
      action: handleSyncFireflies,
      loading: syncingFireflies
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
            <div className="mb-8">
              <div className="h-8 bg-gray-800 rounded-lg w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-800 rounded w-96 animate-pulse"></div>
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

        {/* Voice Bot Trigger */}
        {!isLoading && !error && (
          <motion.div
            className="mb-6 flex justify-end"
            variants={itemVariants}
          >
            <motion.button
              onClick={startRecording}
              className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Mic className="w-6 h-6" />
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </motion.button>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column Skeleton */}
            <div className="lg:col-span-2 space-y-8">
              {/* Summary Cards Skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-700 rounded w-16 mb-1 animate-pulse"></div>
                        <div className="h-6 bg-gray-700 rounded w-8 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Projects Skeleton */}
              <div className="card">
                <div className="h-6 bg-gray-700 rounded w-32 mb-6 animate-pulse"></div>
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-3 p-4 rounded-lg bg-gray-700/30 border border-gray-600/50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-700 rounded w-24 mb-1 animate-pulse"></div>
                          <div className="h-3 bg-gray-700 rounded w-32 animate-pulse"></div>
                        </div>
                        <div className="h-5 bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-700 rounded-full animate-pulse"></div>
                        <div className="flex justify-between">
                          <div className="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                          <div className="h-3 bg-gray-700 rounded w-20 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-6 h-6 bg-gray-700 rounded-full animate-pulse"></div>
                        <div className="w-6 h-6 bg-gray-700 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Skeleton */}
              <div className="card">
                <div className="h-6 bg-gray-700 rounded w-32 mb-6 animate-pulse"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start space-x-3 p-3">
                      <div className="w-2 h-2 bg-gray-700 rounded-full mt-2 animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-700 rounded w-full mb-1 animate-pulse"></div>
                        <div className="h-2 bg-gray-700 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column Skeleton */}
            <div className="space-y-8">
              {/* Today's Schedule Skeleton */}
              <div className="card">
                <div className="h-6 bg-gray-700 rounded w-32 mb-6 animate-pulse"></div>
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-start space-x-3 p-3">
                      <div className="w-2 h-2 bg-gray-700 rounded-full mt-1 animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-700 rounded w-24 mb-1 animate-pulse"></div>
                        <div className="h-2 bg-gray-700 rounded w-32 mb-1 animate-pulse"></div>
                        <div className="h-2 bg-gray-700 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Skeleton */}
              <div className="card">
                <div className="h-6 bg-gray-700 rounded w-32 mb-6 animate-pulse"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 p-2">
                      <div className="w-4 h-4 bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrations Skeleton */}
              <div className="card">
                <div className="h-6 bg-gray-700 rounded w-24 mb-6 animate-pulse"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-3 p-2">
                      <div className="w-4 h-4 bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded w-16 animate-pulse"></div>
                      <div className="ml-auto w-2 h-2 bg-gray-700 rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                    className="quick-action-item cursor-pointer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ x: 5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.action}
                  >
                    <div className="flex items-center space-x-3">
                      {action.loading ? (
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      ) : (
                        <action.icon className="w-4 h-4 text-gray-400" />
                      )}
                      <div className="flex-1">
                        <span className="text-sm text-gray-200">{action.title}</span>
                        <div className="text-xs text-gray-400">{action.subtitle}</div>
                      </div>
                    </div>
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
        )}

        {/* Widgets Section */}
        {!isLoading && !error && dashboardData?.widgets && dashboardData.widgets.length > 0 && (
          <motion.div
            className="mt-8"
            variants={itemVariants}
          >
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-100">Active Widgets</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">{dashboardData.widgets.length} widgets</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {dashboardData.widgets.map((widget, index) => (
                  <motion.div
                    key={widget.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {renderWidget(widget)}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Notes Section */}
        {!isLoading && !error && (
          <motion.div
            className="mt-8"
            variants={itemVariants}
          >
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-100">Notes</h3>
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Voice notes enabled</span>
                </div>
              </div>
              
              {/* Title Input */}
              <div className="mb-4">
                <label htmlFor="dashboardNoteTitle" className="block text-sm font-medium text-gray-300 mb-2">
                  Note Title *
                </label>
                <input
                  id="dashboardNoteTitle"
                  type="text"
                  value={dashboardNoteTitle}
                  onChange={(e) => setDashboardNoteTitle(e.target.value)}
                  placeholder="Enter a title for your note..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  required
                />
              </div>

              {/* Notes Textarea */}
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes here... Use the voice bot to add voice notes!"
                className="w-full h-32 p-4 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              />
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={saveDashboardNotes}
                  disabled={isSavingNotes || !dashboardNoteTitle.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Notes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* All Notes List */}
            <div className="card mt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-100">All Notes</h3>
                <button
                  onClick={fetchAllNotes}
                  disabled={isLoadingNotes}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoadingNotes ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              {isLoadingNotes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-400">Loading notes...</span>
                </div>
              ) : allNotes.length > 0 ? (
                <div className="space-y-4">
                  {allNotes.map((note) => (
                    <motion.div
                      key={note.id}
                      className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/50 hover:bg-gray-700/50 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-100">{note.title}</h4>
                        <div className="flex items-center space-x-2">
                          {note.is_pinned && (
                            <span className="px-2 py-1 text-xs bg-yellow-600/20 text-yellow-400 rounded-full">
                              Pinned
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(note.created_at || note.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No notes found</p>
                  <p className="text-sm text-gray-500">Create your first note above</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Voice Bot Modal */}
      {showVoiceBot && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-100">Voice Notes</h2>
              <button
                onClick={closeVoiceBot}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="text-center mb-6">
              {isRecording ? (
                <div className="space-y-4">
                  <motion.div
                    className="w-20 h-20 bg-red-500 rounded-full mx-auto flex items-center justify-center"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <MicOff className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-gray-100 font-medium">Recording...</p>
                    <p className="text-gray-400 text-sm">Click to stop recording</p>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Stop Recording
                  </button>
                </div>
              ) : audioBlob ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto flex items-center justify-center">
                    <Volume2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-100 font-medium">Audio Recorded</p>
                    <p className="text-gray-400 text-sm">Ready to transcribe</p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={transcribeAudio}
                      disabled={isTranscribing}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {isTranscribing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Transcribing...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span>Transcribe Audio</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={startRecording}
                      className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Record Again
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto flex items-center justify-center">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-100 font-medium">Ready to Record</p>
                    <p className="text-gray-400 text-sm">Click to start recording</p>
                  </div>
                  <button
                    onClick={startRecording}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Start Recording
                  </button>
                </div>
              )}
            </div>

            {transcription && (
              <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
                <h3 className="text-sm font-medium text-gray-100 mb-4">Save Note</h3>
                
                {/* Title Input */}
                <div className="mb-4">
                  <label htmlFor="noteTitle" className="block text-sm font-medium text-gray-300 mb-2">
                    Note Title *
                  </label>
                  <input
                    id="noteTitle"
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Enter a title for your note..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                </div>

                {/* Transcription Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Transcription:</h4>
                  <p className="text-gray-300 text-sm bg-gray-800 p-3 rounded-lg border border-gray-600/50">
                    {transcription}
                  </p>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveNotes}
                  disabled={isSavingNotes || !noteTitle.trim()}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isSavingNotes ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Notes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save to Notes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Dashboard 