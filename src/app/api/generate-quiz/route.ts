import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { QuizGenerationRequest, QuizPayload, QuizQuestion } from '@/types/quiz';

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

  try {
    let response;

    if (request.mode === 'manual') {
      // Option 1: Manual inputs
      response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            "role": "system",
            "content": [
              {
                "type": "input_text",
                "text": `You are a quiz creator tool for teachers. The quiz you generate will be used to test students on particular material. Please make a quiz that is appropriate for the following use case

subject: ${subject}
grade: ${grade}
number of problems: ${numQuestions}
topic of focus: ${focusArea}
difficulty level: ${difficulty}

Return the JSON schema only`
              }
            ]
          }
        ],
        text: {
          "format": {
            "type": "json_schema",
            "name": "quiz_questions_array",
            "strict": true,
            "schema": {
              "type": "object",
              "properties": {
                "questions": {
                  "type": "array",
                  "description": "An array of quiz questions.",
                  "items": {
                    "type": "object",
                    "properties": {
                      "question": {
                        "type": "string",
                        "description": "The quiz question to be answered."
                      }
                    },
                    "required": [
                      "question"
                    ],
                    "additionalProperties": false
                  }
                }
              },
              "required": [
                "questions"
              ],
              "additionalProperties": false
            }
          }
        },
        reasoning: {},
        tools: [],
        temperature: 1,
        max_output_tokens: 2048,
        top_p: 1,
        store: true
      });
    } else {
      // Option 2: File upload
      response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: [
          {
            "role": "system",
            "content": [
              {
                "type": "input_text",
                "text": `You are a quiz creator tool for teachers. The quiz you generate will be used to test students on particular material. Please make a quiz that is based off of the attached lesson plan. Also ensure the quiz meets the following guidelines:

Number of problems: ${numQuestions}
Difficulty Level: ${difficulty}

Return the JSON schema only`
              }
            ]
          },
          {
            "role": "user",
            "content": [
              {
                "type": "input_file",
                "filename": request.fileName,
                "file_data": request.fileBase64
              }
            ]
          }
        ],
        text: {
          "format": {
            "type": "json_schema",
            "name": "quiz_questions_array",
            "strict": true,
            "schema": {
              "type": "object",
              "properties": {
                "questions": {
                  "type": "array",
                  "description": "An array of quiz questions.",
                  "items": {
                    "type": "object",
                    "properties": {
                      "question": {
                        "type": "string",
                        "description": "The quiz question to be answered."
                      }
                    },
                    "required": [
                      "question"
                    ],
                    "additionalProperties": false
                  }
                }
              },
              "required": [
                "questions"
              ],
              "additionalProperties": false
            }
          }
        },
        reasoning: {},
        tools: [],
        temperature: 1,
        max_output_tokens: 2048,
        top_p: 1,
        store: true
      });
    }

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON response
    try {
      const parsedResponse = JSON.parse(content);
      const questions = parsedResponse.questions || [];
      
      // Format questions to match our QuizQuestion interface
      const formattedQuestions: QuizQuestion[] = questions.map((q: any, index: number) => ({
        id: `q${index + 1}`,
        prompt: q.question,
        options: [], // No options for text-based answers
        correctOptionId: '', // No correct option for text-based answers
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
  
  const questionTemplates = [
    `What is the main topic of ${focusArea} in ${subject}?`,
    `Which of the following best describes ${focusArea}?`,
    `When studying ${focusArea}, what is the most important first step?`,
    `What is the primary goal of learning about ${focusArea}?`,
    `Which approach is best for mastering ${focusArea}?`
  ];

  // Generate the requested number of questions
  for (let i = 0; i < Math.min(request.numProblems, questionTemplates.length); i++) {
    questions.push({
      id: `q${i + 1}`,
      prompt: questionTemplates[i],
      options: [], // No options for text-based answers
      correctOptionId: '', // No correct option for text-based answers
      points: 1
    });
  }

  // If more questions are requested, generate additional ones
  for (let i = questionTemplates.length; i < request.numProblems; i++) {
    questions.push({
      id: `q${i + 1}`,
      prompt: `Question ${i + 1}: What is an important aspect of ${focusArea}?`,
      options: [], // No options for text-based answers
      correctOptionId: '', // No correct option for text-based answers
      points: 1
    });
  }

  return questions;
}
