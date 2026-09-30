import { useState } from 'react'
import './App.css'

const API_BASE_URL = 'http://localhost:8080'

const modes = [
  { id: 'professor', label: '교수님', icon: '🎓', endpoint: '/api/ai/professor' },
  { id: 'grandpa', label: '할아버지', icon: '👴', endpoint: '/api/ai/grandpa' },
  { id: 'children', label: '어린이', icon: '🧒', endpoint: '/api/ai/children' },
  { id: 'custom', label: '사용자 지정', icon: '✨' },
]

function App() {
  const [mode, setMode] = useState('professor')
  const [messagesByMode, setMessagesByMode] = useState({
    professor: [],
    grandpa: [],
    children: [],
    custom: [],
  })
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customRole, setCustomRole] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [customLength, setCustomLength] = useState(500)
  const [customResponse, setCustomResponse] = useState('')

  const selectedMode = modes.find((item) => item.id === mode) ?? modes[0]
  const messages = messagesByMode[mode] ?? []
  const customCanSend = Boolean(
    customRole.trim() &&
    customSubject.trim() &&
    Number.isFinite(Number(customLength)) &&
    Number(customLength) >= 100,
  )

  const changeMode = (nextMode) => {
    if (loading) return

    setMode(nextMode)
  }

  const sendMessage = async () => {
    const question = prompt.trim()

    if (!question || loading) return

    setMessagesByMode((currentMessages) => ({
      ...currentMessages,
      [mode]: [
        ...(currentMessages[mode] ?? []),
        { role: 'user', content: question },
      ],
    }))
    setPrompt('')
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}${selectedMode.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(question),
      })

      if (!response.ok) {
        throw new Error('AI response request failed')
      }

      const content = await response.text()
      setMessagesByMode((currentMessages) => ({
        ...currentMessages,
        [mode]: [
          ...(currentMessages[mode] ?? []),
          { role: 'assistant', content },
        ],
      }))
    } catch {
      setError('AI 응답을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChatSubmit = (event) => {
    event.preventDefault()
    sendMessage()
  }

  const handleChatKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const sendCustomRequest = async (event) => {
    event.preventDefault()

    if (!customCanSend || loading) return

    setError('')
    setCustomResponse('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: customRole.trim(),
          subject: customSubject.trim(),
          length: Number(customLength),
        }),
      })

      if (!response.ok) {
        throw new Error('Custom AI response request failed')
      }

      const data = await response.json()
      setCustomResponse(data.content)
    } catch {
      setError('AI 응답을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">AI CHAT SERVICE</p>
        <h1>AI Playground</h1>
        <p className="subtitle">Spring AI + Ollama Chat</p>
      </header>

      <nav className="mode-selector" aria-label="AI 모드 선택">
        {modes.map((item) => (
          <button
            className={`mode-button ${mode === item.id ? 'is-selected' : ''}`}
            type="button"
            key={item.id}
            onClick={() => changeMode(item.id)}
            disabled={loading}
            aria-pressed={mode === item.id}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="main-content">
        {mode === 'custom' ? (
          <section className="custom-panel" aria-labelledby="custom-title">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">CUSTOM AI</p>
                <h2 id="custom-title">나만의 AI에게 물어보세요</h2>
              </div>
              <span className="mode-icon" aria-hidden="true">✨</span>
            </div>

            <form className="custom-form" onSubmit={sendCustomRequest}>
              <label>
                역할
                <input
                  type="text"
                  value={customRole}
                  onChange={(event) => setCustomRole(event.target.value)}
                  placeholder="예: 컴퓨터 공학과 교수"
                  disabled={loading}
                />
              </label>

              <label>
                주제 / 요청
                <textarea
                  value={customSubject}
                  onChange={(event) => setCustomSubject(event.target.value)}
                  placeholder="예: JPA의 영속성 컨텍스트를 초보자에게 설명해줘"
                  rows="5"
                  disabled={loading}
                />
              </label>

              <label>
                답변 길이
                <input
                  type="number"
                  min="100"
                  value={customLength}
                  onChange={(event) => setCustomLength(event.target.value)}
                  disabled={loading}
                />
              </label>

              <div className="form-footer">
                <p>답변 길이는 100자 이상으로 입력해 주세요.</p>
                <button type="submit" className="send-button" disabled={!customCanSend || loading}>
                  {loading ? '생성 중...' : '답변 생성'}
                </button>
              </div>
            </form>

            {loading && (
              <div className="loading-message" aria-live="polite">
                <span className="loading-dot" aria-hidden="true"></span>
                답변 생성 중...
              </div>
            )}

            {error && <p className="error-message" role="alert">{error}</p>}

            {customResponse && (
              <article className="custom-response" aria-live="polite">
                <span className="message-label">AI</span>
                <p>{customResponse}</p>
              </article>
            )}
          </section>
        ) : (
          <section className="chat-panel" aria-label={`${selectedMode.label} AI 채팅`}>
            <div className="chat-panel-header">
              <div>
                <p className="section-kicker">{selectedMode.label.toUpperCase()} AI</p>
                <h2>{selectedMode.label} AI와 대화하기</h2>
              </div>
              <span className="mode-icon" aria-hidden="true">{selectedMode.icon}</span>
            </div>

            <div className="message-list" aria-live="polite">
              {messages.length === 0 && !loading && (
                <p className="empty-state">궁금한 점을 입력해 대화를 시작해 보세요.</p>
              )}

              {messages.map((message, index) => (
                <article className={`message ${message.role}`} key={`${message.role}-${index}`}>
                  <span className="message-label">
                    {message.role === 'user' ? '나' : 'AI'}
                  </span>
                  <p>{message.content}</p>
                </article>
              ))}

              {loading && (
                <div className="loading-message">
                  <span className="loading-dot" aria-hidden="true"></span>
                  답변 생성 중...
                </div>
              )}
            </div>

            {error && <p className="error-message" role="alert">{error}</p>}

            <form className="chat-input-form" onSubmit={handleChatSubmit}>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder={`${selectedMode.label} AI에게 질문해 보세요.`}
                aria-label="질문 입력"
                rows="2"
                disabled={loading}
              />
              <button type="submit" className="send-button" disabled={!prompt.trim() || loading}>
                {loading ? '생성 중...' : '전송'}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
