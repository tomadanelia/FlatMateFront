import type {
  AlgorithmConfig,
  AlgorithmKey,
  AvatarUpdate,
  AuthResponse,
  ArtistSearchResult,
  MatchSearchResponse,
  ProfileInput,
  Question,
  QuestionInput,
  SessionUser,
  Submission,
  TestDefinition,
  TestSummary,
  UserProfile,
  UserRole,
  UserTastes,
  MusicGenre,
  MovieGenre,
  MovieSearchResult,
  ChatMessage,
  Conversation,
  MessageHistory,
} from "../types";

const configuredBase = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).trim();
export const API_BASE_URL = configuredBase.replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken() {
  try {
    return JSON.parse(localStorage.getItem("havenly_session") || "null")
      ?.accessToken as string | undefined;
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const raw = typeof data === "object" && data ? data.message : data;
    const message = Array.isArray(raw)
      ? raw.join(". ")
      : raw || `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }
  return data as T;
}

export const api = {
  signup: (input: { email: string; password: string; displayName: string }) =>
    request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  login: (input: { email: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getUser: (id: string) =>
    request<UserProfile | null>(`/api/users/${encodeURIComponent(id)}`),
  saveProfile: (input: ProfileInput) =>
    request<UserProfile>("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  updateAvatar: (avatarUrl: string | null) =>
    request<AvatarUpdate>("/api/users/me/avatar", {
      method: "PATCH",
      body: JSON.stringify({ avatarUrl }),
    }),
  getTests: () => request<TestSummary[]>("/api/tests"),
  getTest: (slug: string) =>
    request<TestDefinition | null>(`/api/tests/${encodeURIComponent(slug)}`),
  submitTest: (input: {
    userId: string;
    testDefinitionId: string;
    answers: { questionId: string; value: number }[];
  }) =>
    request<Submission>("/api/tests/submissions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getMusicGenres: () => request<MusicGenre[]>("/api/music-genres"),
  searchArtists: (search: string, limit = 20) =>
    request<ArtistSearchResult[]>(
      `/api/artists?${new URLSearchParams({ search, limit: String(limit) })}`,
    ),
  getMovieGenres: () => request<MovieGenre[]>("/api/movie-genres"),
  searchMovies: (search: string, limit = 20) =>
    request<MovieSearchResult[]>(
      `/api/movies?${new URLSearchParams({ search, limit: String(limit) })}`,
    ),
  getTastes: (userId: string) =>
    request<UserTastes>(`/api/tastes/${encodeURIComponent(userId)}`),
  saveMusicTastes: (
    userId: string,
    musicGenreIds: string[],
    artistIds: string[],
  ) =>
    request<unknown>(`/api/users/${encodeURIComponent(userId)}/music-tastes`, {
      method: "PUT",
      body: JSON.stringify({ musicGenreIds, artistIds }),
    }),
  saveMovieTastes: (
    userId: string,
    movieGenreIds: string[],
    movieIds: string[],
  ) =>
    request<unknown>(`/api/users/${encodeURIComponent(userId)}/movie-tastes`, {
      method: "PUT",
      body: JSON.stringify({ movieGenreIds, movieIds }),
    }),
  searchMatches: (input: {
    userId: string;
    limit?: number;
    algorithms?: AlgorithmKey[];
  }) =>
    request<MatchSearchResponse>("/api/matches/search", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getAlgorithms: () => request<AlgorithmConfig[]>("/api/admin/algorithms"),
  updateAlgorithm: (
    key: AlgorithmKey,
    input: Partial<Pick<AlgorithmConfig, "enabled" | "weight" | "version">> & {
      settings?: Record<string, unknown>;
    },
  ) =>
    request<AlgorithmConfig>(`/api/admin/algorithms/${key}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  addQuestions: (testId: string, questions: QuestionInput[]) =>
    request<Question[]>(
      `/api/admin/tests/${encodeURIComponent(testId)}/questions`,
      { method: "POST", body: JSON.stringify({ questions }) },
    ),
  updateQuestion: (id: string, input: Partial<QuestionInput>) =>
    request<Question>(`/api/admin/questions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  updateRole: (id: string, role: UserRole) =>
    request<SessionUser>(`/api/admin/users/${encodeURIComponent(id)}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  getConversations: () =>
    request<Conversation[]>("/api/messages/conversations"),
  getOrCreateConversation: (recipientId: string) =>
    request<Conversation>("/api/messages/conversations", {
      method: "POST",
      body: JSON.stringify({ recipientId }),
    }),
  getMessages: (conversationId: string, limit = 50, cursor?: string) => {
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor) query.set("cursor", cursor);
    return request<MessageHistory>(
      `/api/messages/conversations/${encodeURIComponent(conversationId)}?${query}`,
    );
  },
  sendMessage: (conversationId: string, body: string) =>
    request<ChatMessage>(
      `/api/messages/conversations/${encodeURIComponent(conversationId)}`,
      { method: "POST", body: JSON.stringify({ body }) },
    ),
  markConversationRead: (conversationId: string) =>
    request<unknown>(
      `/api/messages/conversations/${encodeURIComponent(conversationId)}/read`,
      { method: "PATCH" },
    ),
};

export function friendlyError(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError)
    return `Could not reach the API at ${API_BASE_URL}. Check that the backend is running.`;
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
