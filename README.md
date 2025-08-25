# VT Quiz Generator

A gamified, interactive quiz generator tool built with Next.js that matches Varsity Tutors production tools UI/UX. Users can create quizzes via manual inputs or lesson-plan upload, with interactive quiz taking, scoring, and PDF export capabilities.

## Features

### ✅ **Generation Options**
- **Manual Input Mode**: Subject, grade level, focus area, difficulty, and number of questions
- **File Upload Mode**: Upload PDF, PNG, JPG/JPEG files to generate quizzes from content
- **AI-Powered**: Uses OpenAI GPT-4 to generate engaging, educational questions

### ✅ **Interactive Quiz Experience**
- **Multiple Choice**: 4 options per question with single correct answer
- **Progress Tracking**: Visual progress indicator and question counter
- **Real-time Scoring**: Points and percentage calculation
- **Completion Screen**: Score summary with personalized feedback
- **Gamified Elements**: Engaging UI with animations and progress indicators

### ✅ **Export Functionality**
- **PDF Export**: Download quiz with questions and separate answer key
- **Professional Formatting**: Clean, readable PDF layout
- **Answer Key**: Separate section with correct answers

### ✅ **Technical Features**
- **Next.js 14**: Modern React framework with App Router
- **TypeScript**: Full type safety throughout
- **OpenAI Integration**: GPT-4 for intelligent question generation
- **Responsive Design**: Works on desktop and mobile
- **Accessibility**: WAI-ARIA compliant components

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/informedecommerce/vt_quiz_generator.git
   cd vt_quiz_generator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```bash
   # OpenAI API Key
   # Get your API key from https://platform.openai.com/api-keys
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Manual Quiz Generation

1. Select "Manual Input" mode
2. Enter the subject (e.g., Mathematics, Science, History)
3. Optionally select a grade level (K-5, 6-8, 9-12, College)
4. Specify a focus area (e.g., Algebra, World War II, Photosynthesis)
5. Choose the number of questions (1-50)
6. Select difficulty level (Easy, Moderate, Challenging)
7. Click "Generate Quiz"

### File Upload Quiz Generation

1. Select "File Upload" mode
2. Upload a PDF, PNG, or JPG/JPEG file (max 10MB)
3. Choose the number of questions and difficulty
4. Click "Generate Quiz"

### Taking Quizzes

1. Answer each question by selecting one of the four options
2. Navigate between questions using Previous/Next buttons
3. Complete the quiz to see your score and feedback
4. Download the PDF version with questions and answer key
5. Option to retake the quiz or generate a new one

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate-quiz/
│   │       └── route.ts          # API route for quiz generation
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
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
  totalPoints: number;
  createdAtISO: string;
}
```

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: Formik with Yup validation
- **UI Components**: Custom components with Radix UI primitives
- **AI**: OpenAI GPT-4
- **PDF Generation**: jsPDF
- **State Management**: React hooks

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Configuration

The application requires the following environment variables:

- `OPENAI_API_KEY` - Your OpenAI API key for question generation

### Local Development

1. The development server runs on `http://localhost:3000`
2. API routes are available at `/api/*`
3. Hot reloading is enabled for development
4. TypeScript checking runs in the background

## Deployment

### Netlify (Recommended)

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variable: `OPENAI_API_KEY`
5. Deploy!

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variable: `OPENAI_API_KEY`
3. Deploy automatically on push to main branch

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the GitHub repository.

---

**Note**: This tool is designed to match Varsity Tutors production tools UI/UX. The AI prompt/response implementation and internal data structures are flexible and can be customized as needed.
