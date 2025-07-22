"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  FolderOpen,
  AlertTriangle,
  Calendar,
  Upload,
  FolderSyncIcon as Sync,
  ImportIcon as FileImport,
  Clock,
  Activity,
} from "lucide-react"

export function Dashboard() {
  const metrics = [
    { label: "Tasks Completed", value: 47, icon: CheckCircle, color: "text-green-500", change: "+12%" },
    { label: "Active Projects", value: 5, icon: FolderOpen, color: "text-blue-500", change: "" },
    { label: "Blockers", value: 3, icon: AlertTriangle, color: "text-yellow-500", change: "" },
    { label: "Meetings", value: 4, icon: Calendar, color: "text-purple-500", change: "Today" },
  ]

  const projects = [
    { name: "PayNow", subtitle: "Payment Platform", progress: 75, status: "On Track", tasks: "23/31 tasks" },
    {
      name: "CRM Dashboard",
      subtitle: "Customer Management UI",
      progress: 45,
      status: "At Risk",
      tasks: "12/28 tasks",
    },
  ]

  const schedule = [
    { time: "9:00 AM", title: "Sprint Planning", subtitle: "Team meeting for Q1 roadmap" },
    { time: "2:00 PM", title: "Client Review", subtitle: "PayNow prototype demo" },
  ]

  const quickActions = [
    { icon: Upload, label: "Upload Requirements", description: "Add project docs" },
    { icon: Sync, label: "Sync Confluence", description: "Update documentation" },
    { icon: FileImport, label: "Import from Fireflies", description: "Process meeting notes" },
  ]

  const integrations = [
    { name: "JIRA", status: "connected", color: "bg-blue-500" },
    { name: "Confluence", status: "connected", color: "bg-blue-600" },
    { name: "Fireflies", status: "connected", color: "bg-orange-500" },
  ]

  const recentActivity = [
    { user: "John Doe", action: 'completed task "API Integration"', time: "5 minutes ago" },
    { user: "Sarah Wilson", action: "updated project timeline", time: "1 hour ago" },
    { user: "Mike Johnson", action: "reported blocker in PayNow", time: "2 hours ago" },
  ]

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    {metric.change && (
                      <Badge variant="secondary" className="text-xs">
                        {metric.change}
                      </Badge>
                    )}
                  </div>
                </div>
                <metric.icon className={`w-8 h-8 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Projects */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FolderOpen className="w-5 h-5" />
                <span>Active Projects</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {projects.map((project, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.subtitle}</p>
                    </div>
                    <Badge variant={project.status === "On Track" ? "default" : "destructive"} className="text-xs">
                      {project.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span>{project.tasks}</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Today's Schedule */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>{"Today's Schedule"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedule.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="text-sm font-medium text-primary min-w-[60px]">{item.time}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <Button key={index} variant="ghost" className="w-full justify-start h-auto p-3 text-left">
                  <action.icon className="w-4 h-4 mr-3 text-primary" />
                  <div>
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {integrations.map((integration, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${integration.color}`} />
                    <span className="text-sm font-medium">{integration.name}</span>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
