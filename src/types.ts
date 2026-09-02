export type UserRole = "USER" | "ADMIN";
export type Gender =
  | "WOMAN"
  | "MAN"
  | "NON_BINARY"
  | "OTHER"
  | "PREFER_NOT_TO_SAY";
export type LookingFor = "male" | "female" | "all";
export type TestType = "BIG_FIVE" | "HEXACO" | "CUSTOM";
export type QuestionKind =
  | "LIKERT"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "BOOLEAN"
  | "NUMBER"
  | "TEXT";
export type IntegrationProvider = "SPOTIFY" | "LETTERBOXD";
export type IntegrationStatus =
  | "PENDING"
  | "CONNECTED"
  | "EXPIRED"
  | "ERROR"
  | "DISCONNECTED";
export type AlgorithmKey = "PERSONALITY" | "TASTE" | "LIFESTYLE";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
}

export interface AdminUser {
  id: string;
  displayName: string | null;
  email?: string;
}

export type PersonalityTestStatus =
  | "NONE"
  | "SHORT_ONLY"
  | "LONG_ONLY"
  | "BOTH";

export type CompletedPersonalityTestStatus = Exclude<
  PersonalityTestStatus,
  "NONE"
>;

export interface AdminUserCompletionStatus {
  userId: string;
  personalityTests: {
    status: PersonalityTestStatus;
    completedShort: boolean;
    completedLong: boolean;
  };
  tastes: {
    selected: boolean;
    counts: {
      musicGenres: number;
      favoriteArtists: number;
      movieGenres: number;
      favoriteMovies: number;
      importedItems: number;
    };
  };
}

export interface DeletedAdminUser {
  id: string;
  email: string;
  deleted: true;
}
export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  user: SessionUser;
}

export interface HousingPreference {
  id: string;
  userId: string;
  city: string;
  countryCode: string;
  minMonthlyBudget: number;
  maxMonthlyBudget: number;
  currency: string;
  moveInDate: string | null;
  preferredAreas: string[];
}

export interface LifestyleProfile {
  id: string;
  userId: string;
  cleanliness: number;
  socialLevel: number;
  sleepSchedule: number;
  noiseTolerance: number;
  guestsFrequency: number;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  hasPets: boolean;
}

export interface IntegrationSummary {
  provider: IntegrationProvider;
  username: string | null;
  status: IntegrationStatus;
  lastSyncedAt: string | null;
}

export interface LetterboxdFavorite {
  externalId: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  filmUrl: string;
}

export interface LetterboxdIntegration {
  provider: IntegrationProvider;
  username: string;
  profileUrl: string;
  lastSyncedAt: string;
  favorites: LetterboxdFavorite[];
}

export interface UserProfile extends SessionUser {
  birthDate: string | null;
  gender: Gender | null;
  lookingFor?: LookingFor;
  bio: string | null;
  avatarUrl: string | null;
  isDiscoverable: boolean;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
  housingPreference: HousingPreference | null;
  lifestyleProfile: LifestyleProfile | null;
  integrations?: IntegrationSummary[];
}

export interface AvatarUpdate {
  id: string;
  avatarUrl: string | null;
}

export interface ProfileInput {
  id: string;
  email: string;
  displayName: string;
  birthDate?: string;
  gender?: Gender;
  lookingFor?: LookingFor;
  bio?: string;
  city: string;
  countryCode: string;
  minMonthlyBudget: number;
  maxMonthlyBudget: number;
  currency: string;
  moveInDate?: string;
  preferredAreas?: string[];
  cleanliness: number;
  socialLevel: number;
  sleepSchedule: number;
  noiseTolerance: number;
  guestsFrequency: number;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  hasPets: boolean;
}

export interface MusicGenre {
  id: string;
  name: string;
}

export interface ArtistSearchResult {
  id: string;
  name: string;
  genres: { musicGenre: MusicGenre }[];
}

export interface MovieGenre {
  id: string;
  name: string;
}

export interface MovieSearchResult {
  id: string;
  title: string;
  genres: { movieGenre: MovieGenre }[];
}

export interface UserTastes {
  musicGenres: { musicGenre: MusicGenre }[];
  favoriteArtists: { artist: ArtistSearchResult }[];
  movieGenres: { movieGenre: MovieGenre }[];
  favoriteMovies: { movie: MovieSearchResult }[];
}

export interface PublicUserTastes {
  musicGenres: MusicGenre[];
  favoriteArtists: Pick<ArtistSearchResult, "id" | "name">[];
  movieGenres: MovieGenre[];
  favoriteMovies: Pick<MovieSearchResult, "id" | "title">[];
  importedItems?: {
    provider: string;
    kind: string;
    name: string;
    artists: string[];
    genres: string[];
    score: number;
  }[];
}

export interface PublicPersonalityTrait {
  trait: string;
  score: number;
}

export interface PublicUserProfile {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  birthDate?: string | null;
  age?: number | null;
  gender?: Gender | null;
  housingPreference: HousingPreference | null;
  lifestyleProfile: LifestyleProfile | null;
  tastes?: PublicUserTastes | null;
  personality?:
    | PublicPersonalityTrait[]
    | { traits?: PublicPersonalityTrait[]; traitScores?: PublicPersonalityTrait[] }
    | null;
  personalityTraits?: PublicPersonalityTrait[];
  traitScores?: PublicPersonalityTrait[];
}

export interface BlockedUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
}

export type BlockedUserRecord =
  | BlockedUser
  | { blocked: BlockedUser }
  | { blockedUser: BlockedUser }
  | { user: BlockedUser };

export interface TestSummary {
  id: string;
  slug: string;
  name: string;
  type: TestType;
  version: number;
  description: string | null;
}
export interface QuestionOption {
  label: string;
  value: number;
}
export interface Question {
  id: string;
  code: string;
  prompt: string;
  kind: QuestionKind;
  position: number;
  options: QuestionOption[];
  minValue: number | null;
  maxValue: number | null;
  trait?: string;
  reverseScored?: boolean;
  weight?: number;
}
export interface TestDefinition extends TestSummary {
  isActive: boolean;
  createdAt: string;
  questions: Question[];
}
export interface TraitScore {
  id: string;
  attemptId: string;
  trait: string;
  score: number;
}
export interface Submission {
  id: string;
  userId: string;
  testDefinitionId: string;
  completedAt: string | null;
  createdAt: string;
  traitScores: TraitScore[];
}

export interface MatchBreakdown {
  key: AlgorithmKey;
  score: number;
  weight: number;
  version: string;
  explanation: Record<string, unknown>;
}
export interface MatchResult {
  rank: number;
  score: number;
  user: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  breakdown: MatchBreakdown[];
}
export interface MatchSearchResponse {
  runId: string;
  matches: MatchResult[];
}

export interface AlgorithmConfig {
  id: string;
  key: AlgorithmKey;
  enabled: boolean;
  weight: number;
  version: string;
  settings: unknown;
  updatedAt: string;
}

export interface QuestionInput {
  code: string;
  prompt: string;
  kind?: QuestionKind;
  trait: string;
  reverseScored?: boolean;
  position: number;
  options?: unknown[];
  minValue?: number;
  maxValue?: number;
  weight?: number;
}

export interface MessageParticipant {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  sender: MessageParticipant;
}

export interface Conversation {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  participantOne: MessageParticipant;
  participantTwo: MessageParticipant;
  messages?: ChatMessage[];
  _count?: { messages: number };
}

export interface MessageHistory {
  items: ChatMessage[];
  nextCursor: string | null;
}

export interface ConversationReadReceipt {
  conversationId: string;
  userId: string;
  readAt: string;
  updated: number;
  participantIds: string[];
}
