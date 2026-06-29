import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectsApi } from '../lib/api'
import type { Project } from '../types'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!id) return
    projectsApi.list().then(r => {
      const p = r.data.find((p: Project) => p.id === id)
      setProject(p || null)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const addTask = async () => {
    if (!id || !newTask.trim()) return
    await projectsApi.addTask(id, { title: newTask.trim(), order: project?.tasks.length ?? 0 })
    setNewTask('')
    load()
  }

  const toggleTask = async (taskId: string, done: boolean) => {
    if (!id) return
    await projectsApi.updateTask(id, taskId, { done })
    load()
  }

  const publishTask = async (taskId: string) => {
    if (!id) return
    await projectsApi.publishTask(id, taskId)
    navigate('/app')
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>Завантаження...</div>
  if (!project) return <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>Проєкт не знайдено</div>

  const done = project.tasks.filter(t => t.done).length
  const pct = project.tasks.length ? Math.round(done / project.tasks.length * 100) : 0

  return (
    <div>
      {/* Nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'rgba(242,242,247,.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(60,60,67,.18)',
        height: 44, display: 'flex', alignItems: 'center', padding: '0 16px',
      }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#111111', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round">
            <path d="M8.5 1.5L1.5 8.5L8.5 15.5" />
          </svg>
          <span style={{ fontSize: 17 }}>Назад</span>
        </button>
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 17, fontWeight: 600 }}>
          {project.title}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>{project.title}</h1>

        {/* Progress */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Прогрес</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111111' }}>{pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: '#E5E5EA', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, background: '#111111', width: `${pct}%`, transition: 'width .4s' }} />
          </div>
          <div style={{ fontSize: 13, color: '#8E8E93', marginTop: 6 }}>{done} з {project.tasks.length} виконано</div>
        </div>

        {/* Tasks */}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
          Підзадачі
        </div>
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)', marginBottom: 16 }}>
          {project.tasks.map(task => (
            <div key={task.id} style={{ padding: '12px 16px', borderBottom: '0.5px solid #E5E5EA', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => toggleTask(task.id, !task.done)} style={{
                width: 24, height: 24, borderRadius: '50%', border: `2px solid ${task.done ? '#34C759' : '#C7C7CC'}`,
                background: task.done ? '#34C759' : 'transparent', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {task.done && <svg width="12" height="12" fill="none" viewBox="0 0 12 12" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5" /></svg>}
              </button>
              <span style={{ flex: 1, fontSize: 15, textDecoration: task.done ? 'line-through' : 'none', color: task.done ? '#8E8E93' : '#000' }}>
                {task.title}
              </span>
              {!task.done && !task.entry_id && (
                <button onClick={() => publishTask(task.id)} style={{
                  padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: 'rgba(0,0,0,.05)', color: '#333333', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                }}>
                  Знайти →
                </button>
              )}
              {task.entry_id && <span style={{ fontSize: 12, color: '#34C759' }}>опубліковано</span>}
            </div>
          ))}

          {/* Add task input */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <input value={newTask} onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="+ Додати підзадачу"
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 15, color: '#8E8E93',
                background: 'transparent', fontFamily: 'inherit',
              }} />
            {newTask.trim() && (
              <button onClick={addTask} style={{
                padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: '#111111', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              }}>
                Додати
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
