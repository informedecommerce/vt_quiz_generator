import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { QuizGenerationRequest, QuizPayload, QuizQuestion, QuizOption } from '@/types/quiz';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body: QuizGenerationRequest = await request.json();

    // Generate quiz using OpenAI
    const questions = await generateQuizWithAI(body);

    // Create the quiz payload
    const quiz: QuizPayload = {
      id: `quiz_${Date.now()}`,
      subject: body.mode === 'manual' ? body.subject : undefined,
      grade: body.mode === 'manual' ? body.grade : undefined,
      difficulty: body.difficulty,
      questions: questions,
      totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
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

async function generateQuizWithAI(request: QuizGenerationRequest): Promise<QuizQuestion[]> {
  const subject = request.mode === 'manual' ? request.subject : 'General Knowledge';
  const focusArea = request.mode === 'manual' ? request.focusArea : 'Basic Concepts';
  const grade = request.mode === 'manual' ? request.grade : '5th grade';
  const difficulty = request.difficulty;
  const numQuestions = request.numProblems;

  // Content moderation check
  const forbiddenTopics = [
    'serial killers', 'murderers', 'violence', 'sexual', 'pornographic', 'hate speech',
    'extremist', 'graphic violence', 'gore', 'self-harm', 'lgbtia+', 'woke', 'wokeness',
    'adult themes', 'stripping', 'prostitution', 'drugs', 'rape'
  ];

  const inputText = `${subject} ${focusArea}`.toLowerCase();
  for (const topic of forbiddenTopics) {
    if (inputText.includes(topic)) {
      throw new Error('I\'m sorry, but I cannot generate a lesson plan on that topic. Please try something else');
    }
  }

  let prompt = `You are an expert educational content creator. Generate ${numQuestions} multiple-choice questions for a quiz with the following specifications:

Subject: ${subject}
Grade Level: ${grade}
Focus Area/Topic: ${focusArea}
Difficulty: ${difficulty}

IMPORTANT: The questions MUST be specifically about ${focusArea} within the context of ${subject}. Do NOT generate generic math questions if the subject is not Mathematics.

Requirements:
- Each question should have exactly 4 options (A, B, C, D)
- Only one option should be correct
- Questions should be specific and practical about ${focusArea}
- Questions should be appropriate for the specified difficulty level and grade
- Each question is worth 1 point
- Make questions engaging and educational
- Randomly distribute correct answers among all choices (A,B,C,D)
- Avoid "All/None of the above" options
- Use grade-appropriate language and concepts
- Focus on testing knowledge about ${focusArea} specifically

Please format your response as a JSON array with the following structure:
[
  {
    "prompt": "Specific question about ${focusArea}?",
    "options": [
      {"id": "a", "text": "Option A text"},
      {"id": "b", "text": "Option B text"},
      {"id": "c", "text": "Option C text"},
      {"id": "d", "text": "Option D text"}
    ],
    "correctOptionId": "a"
  }
]`;

  // If file upload mode, include file content analysis
  if (request.mode === 'upload') {
    prompt = `You are an expert educational content creator. Analyze the uploaded content and generate ${numQuestions} multiple-choice questions based on the material.

File: ${request.fileName}
Grade Level: ${grade}
Difficulty: ${difficulty}

Requirements:
- Each question should have exactly 4 options (A, B, C, D)
- Only one option should be correct
- Questions should be based on the content in the uploaded file
- Questions should be specific and practical
- Questions should be appropriate for the specified difficulty level and grade
- Each question is worth 1 point
- Make questions engaging and educational
- Randomly distribute correct answers among all choices (A,B,C,D)
- Avoid "All/None of the above" options
- Use grade-appropriate language and concepts

Please format your response as a JSON array with the following structure:
[
  {
    "prompt": "Specific question here?",
    "options": [
      {"id": "a", "text": "Option A text"},
      {"id": "b", "text": "Option B text"},
      {"id": "c", "text": "Option C text"},
      {"id": "d", "text": "Option D text"}
    ],
    "correctOptionId": "a"
  }
]`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator specializing in ${subject}. Generate high-quality, engaging multiple-choice questions that test understanding and knowledge about the specific topic provided. Make questions specific and practical, not general topic questions. Always focus on the exact subject and topic given.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON response
    try {
      const parsedQuestions = JSON.parse(content);
      
      // Validate and format the questions
      const formattedQuestions: QuizQuestion[] = parsedQuestions.map((q: any, index: number) => ({
        id: `q${index + 1}`,
        prompt: q.prompt,
        options: q.options,
        correctOptionId: q.correctOptionId,
        points: 1
      }));

      return formattedQuestions;

    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      // Fallback to mock questions if parsing fails
      return generateMockQuestions(request);
    }

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Check if it's a content moderation error
    if (error instanceof Error && error.message.includes('cannot generate a lesson plan on that topic')) {
      throw error; // Re-throw content moderation errors
    }
    
    // Fallback to mock questions if OpenAI fails
    return generateMockQuestions(request);
  }
}

function generateMockQuestions(request: QuizGenerationRequest): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const subject = request.mode === 'manual' ? request.subject : 'General Knowledge';
  const focusArea = request.mode === 'manual' ? request.focusArea : 'Basic Concepts';
  
  // Generate subject-specific mock questions
  const getSubjectQuestions = (subject: string, focusArea: string) => {
    const subjectLower = subject.toLowerCase();
    const focusLower = focusArea.toLowerCase();
    
    if (subjectLower.includes('math') || subjectLower.includes('mathematics')) {
      return [
        {
          prompt: `What is 5 + 3?`,
          options: [
            { id: 'a', text: '6' },
            { id: 'b', text: '7' },
            { id: 'c', text: '8' },
            { id: 'd', text: '9' }
          ],
          correctOptionId: 'c'
        },
        {
          prompt: `What is 12 - 4?`,
          options: [
            { id: 'a', text: '6' },
            { id: 'b', text: '7' },
            { id: 'c', text: '8' },
            { id: 'd', text: '9' }
          ],
          correctOptionId: 'c'
        },
        {
          prompt: `What is 3 × 4?`,
          options: [
            { id: 'a', text: '10' },
            { id: 'b', text: '11' },
            { id: 'c', text: '12' },
            { id: 'd', text: '13' }
          ],
          correctOptionId: 'c'
        }
      ];
    } else if (subjectLower.includes('history')) {
      return [
        {
          prompt: `What is the capital of ${focusArea}?`,
          options: [
            { id: 'a', text: 'Tashkent' },
            { id: 'b', text: 'Samarkand' },
            { id: 'c', text: 'Bukhara' },
            { id: 'd', text: 'Khiva' }
          ],
          correctOptionId: 'a'
        },
        {
          prompt: `When did ${focusArea} gain independence from the Soviet Union?`,
          options: [
            { id: 'a', text: '1989' },
            { id: 'b', text: '1990' },
            { id: 'c', text: '1991' },
            { id: 'd', text: '1992' }
          ],
          correctOptionId: 'c'
        },
        {
          prompt: `What is the primary language spoken in ${focusArea}?`,
          options: [
            { id: 'a', text: 'Russian' },
            { id: 'b', text: 'Uzbek' },
            { id: 'c', text: 'Kazakh' },
            { id: 'd', text: 'Tajik' }
          ],
          correctOptionId: 'b'
        }
      ];
    } else if (subjectLower.includes('science')) {
      return [
        {
          prompt: `What is the chemical symbol for ${focusArea}?`,
          options: [
            { id: 'a', text: 'O' },
            { id: 'b', text: 'H' },
            { id: 'c', text: 'N' },
            { id: 'd', text: 'C' }
          ],
          correctOptionId: 'a'
        },
        {
          prompt: `Which of the following is a property of ${focusArea}?`,
          options: [
            { id: 'a', text: 'Solid at room temperature' },
            { id: 'b', text: 'Liquid at room temperature' },
            { id: 'c', text: 'Gas at room temperature' },
            { id: 'd', text: 'All of the above' }
          ],
          correctOptionId: 'c'
        }
      ];
    } else if (subjectLower.includes('english') || subjectLower.includes('language')) {
      return [
        {
          prompt: `What part of speech is the word "${focusArea}"?`,
          options: [
            { id: 'a', text: 'Noun' },
            { id: 'b', text: 'Verb' },
            { id: 'c', text: 'Adjective' },
            { id: 'd', text: 'Adverb' }
          ],
          correctOptionId: 'a'
        },
        {
          prompt: `Which of the following is a synonym for "${focusArea}"?`,
          options: [
            { id: 'a', text: 'Similar word 1' },
            { id: 'b', text: 'Similar word 2' },
            { id: 'c', text: 'Similar word 3' },
            { id: 'd', text: 'Similar word 4' }
          ],
          correctOptionId: 'a'
        }
      ];
    } else {
      // Generic questions for other subjects
      return [
        {
          prompt: `What is the main topic of ${focusArea} in ${subject}?`,
          options: [
            { id: 'a', text: 'Basic concepts' },
            { id: 'b', text: 'Advanced theories' },
            { id: 'c', text: 'Historical development' },
            { id: 'd', text: 'Practical applications' }
          ],
          correctOptionId: 'a'
        },
        {
          prompt: `Which of the following best describes ${focusArea}?`,
          options: [
            { id: 'a', text: 'A fundamental concept' },
            { id: 'b', text: 'An advanced technique' },
            { id: 'c', text: 'A historical event' },
            { id: 'd', text: 'A scientific principle' }
          ],
          correctOptionId: 'a'
        },
        {
          prompt: `When studying ${focusArea}, what is the most important first step?`,
          options: [
            { id: 'a', text: 'Understanding the basics' },
            { id: 'b', text: 'Memorizing facts' },
            { id: 'c', text: 'Practicing problems' },
            { id: 'd', text: 'Taking notes' }
          ],
          correctOptionId: 'a'
        }
      ];
    }
  };

  const questionTemplates = getSubjectQuestions(subject, focusArea);

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
    const additionalQuestion = {
      prompt: `What is an important aspect of ${focusArea} in ${subject}?`,
      options: [
        { id: 'a', text: 'Understanding the basics' },
        { id: 'b', text: 'Memorizing facts' },
        { id: 'c', text: 'Practical application' },
        { id: 'd', text: 'Historical context' }
      ],
      correctOptionId: 'a'
    };
    
    questions.push({
      id: `q${i + 1}`,
      prompt: additionalQuestion.prompt,
      options: additionalQuestion.options,
      correctOptionId: additionalQuestion.correctOptionId,
      points: 1
    });
  }

  return questions;
}
