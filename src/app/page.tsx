'use client';

import { useState } from 'react';
import QuizGenerator from '@/components/QuizGenerator';
import QuizDisplay from '@/components/QuizDisplay';
import { QuizPayload } from '@/types/quiz';

export default function Home() {
  const [currentQuiz, setCurrentQuiz] = useState<QuizPayload | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            VT Quiz Generator
          </h1>
          <p className="text-lg text-gray-600">
            Generate custom quizzes with AI or upload your own materials
          </p>
        </header>

        {!currentQuiz ? (
          <QuizGenerator onQuizGenerated={setCurrentQuiz} />
        ) : (
          <QuizDisplay 
            quiz={currentQuiz} 
            onBack={() => setCurrentQuiz(null)}
          />
        )}
      </div>
    </main>
  );
}
