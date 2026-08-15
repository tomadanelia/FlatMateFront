import type {
  AlgorithmConfig, AlgorithmKey, AuthResponse, IntegrationProvider,
  MatchSearchResponse, ProfileInput, Question, QuestionInput, SessionUser,
  Submission, TestDefinition, TestSummary, UserProfile, UserRole,
} from '../types'

const configuredBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').trim()
export const API_BASE_URL = configuredBase.replace(/\/$/, '')

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ApiError' }
}

function getToken() {
  try { return JSON.parse(localStorage.getItem('havenly_session') || 'null')?.accessToken as string | undefined }
  catch { return undefined }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) {
    const raw = typeof data === 'object' && data ? data.message : data
    const message = Array.isArray(raw) ? raw.join('. ') : raw || `Request failed (${response.status})`
    throw new ApiError(response.status, message)
  }
  return data as T
}

export const api = {
  signup: (input: { email: string; password: string; displayName: string }) =>
    request<AuthResponse>('/api/auth/signup', { method: 'POST', body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  getUser: (id: string) => request<UserProfile | null>(`/api/users/${encodeURIComponent(id)}`),
  saveProfile: (input: ProfileInput) => request<UserProfile>('/api/users/profile', { method: 'PUT', body: JSON.stringify(input) }),
  getTests: () => request<TestSummary[]>('/api/tests'),
  getTest: (slug: string) => request<TestDefinition | null>(`/api/tests/${encodeURIComponent(slug)}`),
  submitTest: (input: { userId: string; testDefinitionId: string; answers: { questionId: string; value: number }[] }) =>
    request<Submission>('/api/tests/submissions', { method: 'POST', body: JSON.stringify(input) }),
  connectIntegration: (input: { userId: string; provider: IntegrationProvider; username?: string }) =>
    request('/api/integrations/connect', { method: 'POST', body: JSON.stringify(input) }),
  syncTaste: (input: { userId: string; provider: IntegrationProvider; items: { externalId: string; kind: string; name: string; artists?: string[]; genres?: string[]; score?: number }[] }) =>
    request<{ synced: number }>('/api/integrations/taste/sync', { method: 'POST', body: JSON.stringify(input) }),
  searchMatches: (input: { userId: string; limit?: number; algorithms?: AlgorithmKey[] }) =>
    request<MatchSearchResponse>('/api/matches/search', { method: 'POST', body: JSON.stringify(input) }),
  getAlgorithms: () => request<AlgorithmConfig[]>('/api/admin/algorithms'),
  updateAlgorithm: (key: AlgorithmKey, input: Partial<Pick<AlgorithmConfig, 'enabled' | 'weight' | 'version'>> & { settings?: Record<string, unknown> }) =>
    request<AlgorithmConfig>(`/api/admin/algorithms/${key}`, { method: 'PATCH', body: JSON.stringify(input) }),
  addQuestions: (testId: string, questions: QuestionInput[]) =>
    request<Question[]>(`/api/admin/tests/${encodeURIComponent(testId)}/questions`, { method: 'POST', body: JSON.stringify({ questions }) }),
  updateQuestion: (id: string, input: Partial<QuestionInput>) =>
    request<Question>(`/api/admin/questions/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  updateRole: (id: string, role: UserRole) =>
    request<SessionUser>(`/api/admin/users/${encodeURIComponent(id)}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
}

export function friendlyError(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof TypeError) return `Could not reach the API at ${API_BASE_URL}. Check that the backend is running.`
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
