export type Difficulty = "easy" | "moderate" | "challenging";

export interface QuizGenerationRequestManual {
  mode: "manual";
  subject: string;
  grade?: string;
  numProblems: number;
  focusArea: string;
  difficulty: Difficulty;
}

export interface QuizGenerationRequestUpload {
  mode: "upload";
  fileName: string;
  fileType: "pdf" | "png" | "jpg" | "jpeg";
  fileBase64: string;
  numProblems: number;
  difficulty: Difficulty;
}

export type QuizGenerationRequest =
  | QuizGenerationRequestManual
  | QuizGenerationRequestUpload;

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[]; // Always 4
  correctOptionId: string;
  points: number; // default 1
}

export interface QuizPayload {
  id: string;
  subject?: string;
  grade?: string;
  difficulty: Difficulty;
  questions: QuizQuestion[];
  totalPoints: number;
  createdAtISO: string;
}

export interface QuizScoreSummary {
  totalQuestions: number;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
}


