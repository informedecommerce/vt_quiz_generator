# VT Quiz Generator

A modern web application for generating custom quizzes using AI. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **AI-Powered Quiz Generation**: Generate quizzes using OpenAI's GPT-4
- **Manual Input Mode**: Create quizzes by specifying subject, grade level, and focus area
- **File Upload Mode**: Upload PDFs or images to generate quizzes from content
- **Interactive Quiz Taking**: Take generated quizzes with real-time scoring
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vt_quiz_generator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
# OpenAI API Key
# Get your API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Manual Quiz Generation

1. Select "Manual Input" mode
2. Enter the subject (e.g., Mathematics, Science, History)
3. Optionally select a grade level
4. Specify a focus area (e.g., Algebra, World War II, Photosynthesis)
5. Choose the number of questions (1-50)
6. Select difficulty level (Easy, Moderate, Challenging)
7. Click "Generate Quiz"

### File Upload Quiz Generation

1. Select "File Upload" mode
2. Upload a PDF or image file
3. Choose the number of questions and difficulty
4. Click "Generate Quiz"

### Taking Quizzes

1. Answer each question by selecting one of the four options
2. Navigate between questions using Previous/Next buttons
3. Complete the quiz to see your score
4. Option to retake the quiz or generate a new one

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: Formik with Yup validation
- **UI Components**: Custom components with Radix UI primitives
- **AI**: OpenAI GPT-4
- **State Management**: React hooks
- **PDF Generation**: jsPDF (for future features)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate-quiz/
│   │       └── route.ts          # API route for quiz generation
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Main application page
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Label.tsx
│   │   ├── Progress.tsx
│   │   ├── Select.tsx
│   │   └── Switch.tsx
│   ├── QuizGenerator.tsx         # Quiz generation form
│   └── QuizDisplay.tsx           # Quiz taking interface
├── lib/
│   └── utils.ts                  # Utility functions
└── types/
    └── quiz.ts                   # TypeScript type definitions
```

## API Endpoints

### POST /api/generate-quiz

Generates a quiz based on the provided parameters.

**Request Body:**
```typescript
// Manual mode
{
  mode: "manual";
  subject: string;
  grade?: string;
  numProblems: number;
  focusArea: string;
  difficulty: "easy" | "moderate" | "challenging";
}

// Upload mode
{
  mode: "upload";
  fileName: string;
  fileType: "pdf" | "png" | "jpg" | "jpeg";
  fileBase64: string;
  numProblems: number;
  difficulty: "easy" | "moderate" | "challenging";
}
```

**Response:**
```typescript
{
  id: string;
  subject?: string;
  grade?: string;
  difficulty: string;
  questions: QuizQuestion[];
  createdAtISO: string;
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.
