'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QuizPayload, QuizQuestion, QuizScoreSummary } from '@/types/quiz';
import jsPDF from 'jspdf';

interface QuizDisplayProps {
  quiz: QuizPayload;
  onBack: () => void;
}

export default function QuizDisplay({ quiz, onBack }: QuizDisplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState<QuizScoreSummary | null>(null);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  const handleTextAnswerChange = (questionId: string, answer: string) => {
    setTextAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      calculateScore();
      setIsCompleted(true);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex(prev => prev - 1);
  };

  const calculateScore = () => {
    let earnedPoints = 0;
    let totalPoints = 0;

    quiz.questions.forEach(question => {
      totalPoints += question.points;
      const answer = textAnswers[question.id];
      // For text-based answers, we'll give points for any non-empty answer
      // In a real implementation, you might want to use AI to grade the answers
      if (answer && answer.trim().length > 0) {
        earnedPoints += question.points;
      }
    });

    const percentage = Math.round((earnedPoints / totalPoints) * 100);

    setScore({
      totalQuestions: quiz.questions.length,
      totalPoints,
      earnedPoints,
      percentage
    });
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setTextAnswers({});
    setIsCompleted(false);
    setScore(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const lineHeight = 7;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const title = `${quiz.subject || 'Quiz'} - ${quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}`;
    doc.text(title, margin, yPosition);
    yPosition += 15;

    // Quiz info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Questions: ${quiz.questions.length}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Total Points: ${quiz.totalPoints || quiz.questions.length}`, margin, yPosition);
    yPosition += 15;

    // Questions
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Questions:', margin, yPosition);
    yPosition += 10;

    quiz.questions.forEach((question, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const questionText = `${index + 1}. ${question.prompt}`;
      
      // Split long questions into multiple lines
      const splitText = doc.splitTextToSize(questionText, 170);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * lineHeight + 5;

      // Answer space
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Answer: _________________________________________________', margin, yPosition);
      yPosition += 15;

      yPosition += 8;
    });

    // Add answer key on a new page
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Answer Key', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    quiz.questions.forEach((question, index) => {
      const answerText = `${index + 1}. [Sample answer or key points for grading]`;
      
      const splitAnswerText = doc.splitTextToSize(answerText, 170);
      doc.text(splitAnswerText, margin, yPosition);
      yPosition += splitAnswerText.length * lineHeight + 5;
    });

    // Save the PDF
    const fileName = `${quiz.subject || 'quiz'}_${quiz.difficulty}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  if (isCompleted && score) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Quiz Complete!</h2>
            
            <div className="mb-6 rounded-lg bg-gray-50 p-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {score.percentage}%
              </div>
              <div className="text-lg text-gray-600">
                {score.earnedPoints} out of {score.totalPoints} points
              </div>
              <div className="text-sm text-gray-500">
                {score.totalQuestions} questions answered
              </div>
            </div>

            {/* Feedback message based on score */}
            <div className="mb-6">
              <p className="text-lg text-gray-700">
                {score.percentage >= 90 ? 'Excellent work! You have mastered this material.' :
                 score.percentage >= 80 ? 'Great job! You have a solid understanding.' :
                 score.percentage >= 70 ? 'Good effort! Review the material to improve.' :
                 score.percentage >= 60 ? 'Keep practicing! Focus on the areas you missed.' :
                 'Don\'t give up! Review the material and try again.'}
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={exportToPDF} className="w-full bg-green-600 hover:bg-green-700">
                Download PDF
              </Button>
              <Button onClick={handleRestart} className="w-full">
                Take Quiz Again
              </Button>
              <Button onClick={onBack} variant="outline" className="w-full">
                Generate New Quiz
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {quiz.subject && `${quiz.subject} Quiz`}
            </h2>
            <p className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Difficulty</div>
            <div className="font-medium capitalize">{quiz.difficulty}</div>
          </div>
        </div>
      </Card>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {currentQuestion.prompt}
          </h3>
          
          {/* Text Answer Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Your Answer:
            </label>
            <textarea
              value={textAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleTextAnswerChange(currentQuestion.id, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white resize-none"
              rows={4}
              placeholder="Type your answer here..."
            />
            <p className="text-sm text-gray-500">
              Points: {currentQuestion.points}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!textAnswers[currentQuestion.id] || textAnswers[currentQuestion.id].trim().length === 0}
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next'}
          </Button>
        </div>
      </Card>

      {/* Back Button */}
      <div className="text-center">
        <Button onClick={onBack} variant="ghost">
          ← Back to Generator
        </Button>
      </div>
    </div>
  );
}
