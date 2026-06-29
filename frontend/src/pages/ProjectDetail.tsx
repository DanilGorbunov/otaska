import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { NavBar } from '../components/layout/NavBar'
import { useAppStore } from '../store/appStore'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { projects, toggleTask, addTask, deleteTask, renameProject } = useAppStore()
  const [newTask, setNewTask] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [swipedId, setSwipedId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const project = projects.find(p => p.id === id)

  const handleToggle = (taskId: string) => { if (id) toggleTask(id, taskId) }
  const handleAddTask = () => {
    if (!newTask.trim() || !id) return
    addTask(id, newTask.trim())
    setNewTask('')
  }
  const handleDelete = (taskId: string) => {
    if (id) deleteTask(id, taskId)
    setSwipedId(null)
  }

  const startRename = () => {
    setTitleDraft(project?.title ?? '')
    setEditingTitle(true)
    setTimeout(() => titleRef.current?.select(), 50)
  }
  const commitRename = () => {
    if (titleDraft.trim() && id) renameProject(id, titleDraft.trim())
    setEditingTitle(false)
  }

  if (!project) return (
    <div>
      <NavBar title="Проєкт" />
      <div style={{ textAlign: 'center', padding: 64, color: '#8E8E93' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
        <div style={{ fontSize: 17, fontWeight: 500, color: '#000' }}>Проєкт не знайдено</div>
      </div>
    </div>
  )

  const done = project.tasks.filter(t => t.done).length
  const total = project.tasks.length
  const pct = total ? Math.round(done / total * 100) : 0

  return (
    <div style={{ paddingBottom: 32 }} onClick={() => setSwipedId(null)}>
      <NavBar title="Проєкт" backTitle="Записи" />

      <div style={{ padding: '16px 16px 0' }}>

        {/* Progress card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: 20,
          boxShadow: '0 1px 8px rgba(0,0,0,.07)', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              {editingTitle ? (
                <input
                  ref={titleRef}
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingTitle(false) }}
                  autoFocus
                  style={{
                    width: '100%', fontSize: 18, fontWeight: 700, letterSpacing: '-.3px',
                    border: 'none', borderBottom: '2px solid #111', outline: 'none',
                    background: 'transparent', fontFamily: 'inherit', padding: '2px 0',
                  }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                  onClick={startRename}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.3px' }}>{project.title}</div>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
              )}
              {project.desc && <div style={{ fontSize: 14, color: '#8E8E93', marginTop: 4 }}>{project.desc}</div>}
            </div>
            <span style={{
              fontSize: 22, fontWeight: 800, color: pct === 100 ? '#34C759' : '#111',
              letterSpacing: '-.5px', flexShrink: 0,
            }}>{pct}%</span>
          </div>

          <div style={{ height: 6, borderRadius: 99, background: '#E5E5EA', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: pct === 100 ? '#34C759' : '#111',
              width: `${pct}%`, transition: 'width .4s',
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8E8E93' }}>
            <span>{done} з {total} виконано</span>
            {pct === 100 && <span style={{ color: '#34C759', fontWeight: 600 }}>✓ Завершено</span>}
          </div>
        </div>

        {/* Tasks */}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
          Підзадачі
        </div>
        <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,.07)', marginBottom: 12 }}>
          {project.tasks.map((task, i) => (
            <div key={task.id} style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Delete button revealed on swipe */}
              <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
                background: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'opacity .15s',
                opacity: swipedId === task.id ? 1 : 0,
                pointerEvents: swipedId === task.id ? 'auto' : 'none',
              }}>
                <button onClick={e => { e.stopPropagation(); handleDelete(task.id) }} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#fff',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M8 6V4h8v2" />
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 600 }}>Видалити</span>
                </button>
              </div>

              {/* Task row */}
              <div
                style={{
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                  borderBottom: i < project.tasks.length - 1 ? '0.5px solid #F2F2F7' : 'none',
                  background: '#fff',
                  transform: swipedId === task.id ? 'translateX(-80px)' : 'translateX(0)',
                  transition: 'transform .22s cubic-bezier(.25,.46,.45,.94)',
                }}
                onTouchStart={e => {
                  const startX = e.touches[0].clientX
                  const onMove = (mv: TouchEvent) => {
                    if (startX - mv.touches[0].clientX > 40) setSwipedId(task.id)
                    else if (mv.touches[0].clientX - startX > 10) setSwipedId(null)
                  }
                  document.addEventListener('touchmove', onMove, { once: false })
                  document.addEventListener('touchend', () => document.removeEventListener('touchmove', onMove), { once: true })
                }}
              >
                {/* Checkbox */}
                <button onClick={() => handleToggle(task.id)} style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                  border: `2px solid ${task.done ? '#34C759' : '#C7C7CC'}`,
                  background: task.done ? '#34C759' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}>
                  {task.done && (
                    <svg width="12" height="12" fill="none" viewBox="0 0 12 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </button>

                {editingTaskId === task.id ? (
                  <input
                    autoFocus
                    defaultValue={task.title}
                    onBlur={e => {
                      const val = e.currentTarget.value.trim()
                      if (val && id) {
                        // update task title in store via a rename approach
                        deleteTask(id, task.id)
                        addTask(id, val)
                      }
                      setEditingTaskId(null)
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditingTaskId(null) }}
                    style={{
                      flex: 1, fontSize: 15, border: 'none', borderBottom: '1.5px solid #111',
                      outline: 'none', background: 'transparent', fontFamily: 'inherit', padding: '2px 0',
                    }}
                  />
                ) : (
                  <span
                    onDoubleClick={() => setEditingTaskId(task.id)}
                    style={{
                      flex: 1, fontSize: 15, lineHeight: 1.3,
                      textDecoration: task.done ? 'line-through' : 'none',
                      color: task.done ? '#C7C7CC' : '#000',
                      transition: 'color .15s',
                    }}
                  >
                    {task.title}
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {!task.done && (
                    <button style={{
                      padding: '5px 12px', borderRadius: 99, border: 'none', cursor: 'pointer',
                      background: 'rgba(0,122,255,.1)', color: '#007AFF',
                      fontSize: 12, fontWeight: 600, fontFamily: 'inherit', flexShrink: 0,
                    }}>
                      Знайти →
                    </button>
                  )}
                  {/* Swipe hint / delete shortcut */}
                  <button
                    onClick={e => { e.stopPropagation(); setSwipedId(swipedId === task.id ? null : task.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, opacity: .35 }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#000" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="12" cy="5" r="1" fill="#000" /><circle cx="12" cy="12" r="1" fill="#000" /><circle cx="12" cy="19" r="1" fill="#000" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add task row */}
          <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              border: '2px dashed #C7C7CC',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="10" height="10" fill="none" viewBox="0 0 10 10" stroke="#C7C7CC" strokeWidth="2" strokeLinecap="round">
                <path d="M5 1v8M1 5h8" />
              </svg>
            </div>
            <input
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTask()}
              placeholder="Додати підзадачу..."
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 15,
                color: '#000', background: 'transparent', fontFamily: 'inherit',
              }}
            />
            {newTask.trim() && (
              <button onClick={handleAddTask} style={{
                padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                background: '#111', color: '#fff', fontSize: 13, fontWeight: 600,
                fontFamily: 'inherit', flexShrink: 0,
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
