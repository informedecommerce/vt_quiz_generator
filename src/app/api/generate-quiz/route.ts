import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { QuizGenerationRequest, QuizPayload, QuizQuestion, QuizOption } from '@/types/quiz';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: QuizGenerationRequest = await request.json();

    // Generate mock quiz data based on the request
    const mockQuestions = generateMockQuestions(body);

    // Create the quiz payload
    const quiz: QuizPayload = {
      id: `quiz_${Date.now()}`,
      subject: body.mode === 'manual' ? body.subject : undefined,
      grade: body.mode === 'manual' ? body.grade : undefined,
      difficulty: body.difficulty,
      questions: mockQuestions,
      createdAtISO: new Date().toISOString()
    };

    return NextResponse.json(quiz);

  } catch (error) {
    console.error('Error generating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}

function generateMockQuestions(request: QuizGenerationRequest): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const subject = request.mode === 'manual' ? request.subject : 'General Knowledge';
  const focusArea = request.mode === 'manual' ? request.focusArea : 'Basic Concepts';
  
  const questionTemplates = [
    {
      prompt: `What is the main topic of ${focusArea} in ${subject}?`,
      options: [
        { id: 'a', text: 'Advanced concepts and theories' },
        { id: 'b', text: 'Basic principles and fundamentals' },
        { id: 'c', text: 'Historical background only' },
        { id: 'd', text: 'Practical applications only' }
      ],
      correctOptionId: 'b'
    },
    {
      prompt: `Which of the following best describes ${focusArea}?`,
      options: [
        { id: 'a', text: 'A complex mathematical formula' },
        { id: 'b', text: 'A fundamental concept in the field' },
        { id: 'c', text: 'A historical event' },
        { id: 'd', text: 'A scientific experiment' }
      ],
      correctOptionId: 'b'
    },
    {
      prompt: `When studying ${focusArea}, what is the most important first step?`,
      options: [
        { id: 'a', text: 'Memorizing all formulas' },
        { id: 'b', text: 'Understanding basic principles' },
        { id: 'c', text: 'Reading advanced materials' },
        { id: 'd', text: 'Taking a final exam' }
      ],
      correctOptionId: 'b'
    },
    {
      prompt: `What is the primary goal of learning about ${focusArea}?`,
      options: [
        { id: 'a', text: 'To pass exams only' },
        { id: 'b', text: 'To understand core concepts' },
        { id: 'c', text: 'To memorize facts' },
        { id: 'd', text: 'To complete assignments' }
      ],
      correctOptionId: 'b'
    },
    {
      prompt: `Which approach is best for mastering ${focusArea}?`,
      options: [
        { id: 'a', text: 'Cramming the night before' },
        { id: 'b', text: 'Regular practice and review' },
        { id: 'c', text: 'Reading once and forgetting' },
        { id: 'd', text: 'Avoiding difficult topics' }
      ],
      correctOptionId: 'b'
    }
  ];

  // Generate the requested number of questions
  for (let i = 0; i < Math.min(request.numProblems, questionTemplates.length); i++) {
    const template = questionTemplates[i];
    questions.push({
      id: `q${i + 1}`,
      prompt: template.prompt,
      options: template.options,
      correctOptionId: template.correctOptionId,
      points: 1
    });
  }

  // If more questions are requested, generate additional ones
  for (let i = questionTemplates.length; i < request.numProblems; i++) {
    questions.push({
      id: `q${i + 1}`,
      prompt: `Question ${i + 1}: What is an important aspect of ${focusArea}?`,
      options: [
        { id: 'a', text: 'Understanding the basics' },
        { id: 'b', text: 'Memorizing everything' },
        { id: 'c', text: 'Skipping difficult parts' },
        { id: 'd', text: 'Avoiding practice' }
      ],
      correctOptionId: 'a',
      points: 1
    });
  }

  return questions;
}
