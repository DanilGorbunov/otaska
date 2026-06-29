export function Chat() {
  return (
    <div>
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: 'rgba(242,242,247,.94)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid rgba(60,60,67,.18)',
        height: 44, display: 'flex', alignItems: 'center', padding: '0 16px',
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Чат</h2>
      </div>
      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.5px', margin: '0 0 24px' }}>Чат</h1>
        <div style={{ textAlign: 'center', padding: 48, color: '#8E8E93' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 17, fontWeight: 500, color: '#000', marginBottom: 8 }}>Немає повідомлень</div>
          <div style={{ fontSize: 15 }}>Чат з'явиться після бронювання</div>
        </div>
      </div>
    </div>
  )
}
