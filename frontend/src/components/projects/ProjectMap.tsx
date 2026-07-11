type Task = {
  _id: string
  title: string
  category?: string
  status: string
  budgetMin?: number
  budgetMax?: number
  taskOrder?: number
  dependsOnTaskIds?: string[]
}

const STATUS_COLOR: Record<string, string> = {
  draft: '#D1C8B8', open: '#22C55E', in_progress: '#EF9F27', done: '#3B82F6', cancelled: '#EF4444',
}

export function ProjectMap({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return null

  const done = tasks.filter(t => t.status === 'done').length
  const progress = Math.round((done / tasks.length) * 100)

  const budgetMin = tasks.reduce((sum, t) => sum + (t.budgetMin ?? 0), 0)
  const budgetMax = tasks.reduce((sum, t) => sum + (t.budgetMax ?? 0), 0)

  const byCategory = new Map<string, Task[]>()
  for (const t of tasks) {
    const key = t.category ?? 'Інше'
    if (!byCategory.has(key)) byCategory.set(key, [])
    byCategory.get(key)!.push(t)
  }

  const circumference = 2 * Math.PI * 20

  return (
    <div style={{ background: '#fff', borderRadius: 18, padding: '16px', border: '1.5px solid #EDE8DF', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
          <circle cx="24" cy="24" r="20" fill="none" stroke="#EDE8DF" strokeWidth="5" />
          <circle cx="24" cy="24" r="20" fill="none" stroke="#EF9F27" strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)}
            transform="rotate(-90 24 24)" />
          <text x="24" y="28" textAnchor="middle" fontSize="12" fontWeight="800" fill="#1A1612">{progress}%</text>
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1612' }}>{done} з {tasks.length} завдань виконано</div>
          {(budgetMin > 0 || budgetMax > 0) && (
            <div style={{ fontSize: 13, color: '#EF9F27', fontWeight: 700, marginTop: 2 }}>€{budgetMin}–{budgetMax} загалом</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[...byCategory.entries()].map(([category, catTasks]) => (
          <div key={category} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 99,
            background: '#F5F3EF', fontSize: 12, fontWeight: 600, color: '#5A4A2E',
          }}>
            <span style={{ display: 'flex', gap: 3 }}>
              {catTasks.map(t => (
                <span key={t._id} title={`${t.title} — ${t.status}`} style={{
                  width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[t.status] ?? '#9A8060',
                }} />
              ))}
            </span>
            {category} ({catTasks.length})
          </div>
        ))}
      </div>

      {tasks.some(t => t.taskOrder != null) && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F0EBE3' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8060', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Послідовність</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...tasks].sort((a, b) => (a.taskOrder ?? 99) - (b.taskOrder ?? 99)).map(t => {
              const deps = t.dependsOnTaskIds ?? []
              const byId = new Map(tasks.map(x => [x._id, x]))
              const locked = deps.some(d => byId.get(d)?.status !== 'done')
              return (
                <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: locked ? 0.5 : 1 }}>
                  <span style={{ fontSize: 11 }}>{locked ? '🔒' : '🔓'}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1612' }}>{t.title}</span>
                  {deps.length > 0 && (
                    <span style={{ fontSize: 11, color: '#9A8060' }}>
                      після: {deps.map(d => byId.get(d)?.title ?? '?').join(', ')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
