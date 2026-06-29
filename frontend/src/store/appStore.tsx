import { createContext, useContext, useState, useEffect } from 'react'
import type { Entry, Project } from '../types'
import { MOCK_ENTRIES, MOCK_PROJECTS } from '../lib/mockData'
import { api } from '../lib/api'
import { isLoggedIn } from './authStore'

function load<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fallback } catch { return fallback }
}
function save<T>(key: string, v: T) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* quota exceeded */ }
}

interface AppStore {
  entries: Entry[]
  projects: Project[]
  loading: boolean
  addEntry: (title: string, text: string) => Promise<void>
  deleteEntry: (entryId: string) => Promise<void>
  addProject: (title: string) => Promise<void>
  renameProject: (projectId: string, title: string) => void
  toggleTask: (projectId: string, taskId: string) => Promise<void>
  addTask: (projectId: string, taskTitle: string) => Promise<void>
  deleteTask: (projectId: string, taskId: string) => Promise<void>
  updateProjects: (projects: Project[]) => void
  reload: () => Promise<void>
}

const AppContext = createContext<AppStore | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>(() => load('otaska_entries', MOCK_ENTRIES))
  const [projects, setProjects] = useState<Project[]>(() => load('otaska_projects', MOCK_PROJECTS))
  const [loading, setLoading] = useState(false)

  useEffect(() => { save('otaska_entries', entries) }, [entries])
  useEffect(() => { save('otaska_projects', projects) }, [projects])

  async function reload() {
    if (!isLoggedIn()) return
    try {
      setLoading(true)
      const [entriesRes, projectsRes] = await Promise.all([
        api.get<Entry[]>('/entries'),
        api.get<Project[]>('/projects'),
      ])
      setEntries(entriesRes.data)
      setProjects(projectsRes.data)
    } catch {
      // backend down, keep localStorage data
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  const addEntry = async (title: string, text: string) => {
    const local: Entry = {
      id: `e${Date.now()}`,
      client_id: 'u1',
      title: title || text.slice(0, 80),
      description: text,
      intent_type: 'seeking_service',
      entry_type: 'on_demand',
      status: 'open',
      category: 'renovation',
      city: 'Bratislava',
      budget_min: undefined,
      budget_max: undefined,
      ai_urgency: 'medium',
      created_at: new Date().toISOString(),
      proposal_count: 0,
    }
    setEntries(prev => [local, ...prev])
    try {
      const res = await api.post<Entry>('/entries', {
        title: local.title,
        description: text,
        intent_type: 'seeking_service',
        entry_type: 'on_demand',
        status: 'open',
        city: 'Bratislava',
      })
      setEntries(prev => prev.map(e => e.id === local.id ? res.data : e))
    } catch { /* keep local entry */ }
  }

  const deleteEntry = async (entryId: string) => {
    setEntries(prev => prev.filter(e => e.id !== entryId))
    try {
      await api.delete(`/entries/${entryId}`)
    } catch { /* already removed from UI */ }
  }

  const addProject = async (title: string) => {
    const local: Project = {
      id: `p${Date.now()}`,
      user_id: 'u1',
      title,
      desc: '',
      category: 'renovation',
      tasks: [],
      created_at: new Date().toISOString(),
    }
    setProjects(prev => [local, ...prev])
    try {
      const res = await api.post<Project>('/projects', { title })
      setProjects(prev => prev.map(p => p.id === local.id ? { ...res.data, tasks: [] } : p))
    } catch { /* keep local */ }
  }

  const toggleTask = async (projectId: string, taskId: string) => {
    let done: boolean | undefined
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : {
        ...p,
        tasks: p.tasks.map(t => {
          if (t.id === taskId) { done = !t.done; return { ...t, done: !t.done } }
          return t
        }),
      }
    ))
    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, { done })
    } catch { /* keep local */ }
  }

  const addTask = async (projectId: string, taskTitle: string) => {
    const local = {
      id: `t${Date.now()}`, project_id: projectId,
      title: taskTitle, done: false,
      order: 0, created_at: new Date().toISOString(),
    }
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : { ...p, tasks: [...p.tasks, { ...local, order: p.tasks.length }] }
    ))
    try {
      const res = await api.post(`/projects/${projectId}/tasks`, { title: taskTitle })
      const newTask = (res.data as typeof local)
      setProjects(prev => prev.map(p =>
        p.id !== projectId ? p : { ...p, tasks: p.tasks.map(t => t.id === local.id ? newTask : t) }
      ))
    } catch { /* keep local */ }
  }

  const renameProject = (projectId: string, title: string) => {
    setProjects(prev => prev.map(p => p.id !== projectId ? p : { ...p, title }))
    api.put(`/projects/${projectId}`, { title }).catch(() => {})
  }

  const deleteTask = async (projectId: string, taskId: string) => {
    setProjects(prev => prev.map(p =>
      p.id !== projectId ? p : { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
    ))
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`)
    } catch { /* keep local */ }
  }

  const updateProjects = (updated: Project[]) => setProjects(updated)

  return (
    <AppContext.Provider value={{ entries, projects, loading, addEntry, deleteEntry, addProject, renameProject, toggleTask, addTask, deleteTask, updateProjects, reload }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppStore() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppStore must be used within AppProvider')
  return ctx
}
