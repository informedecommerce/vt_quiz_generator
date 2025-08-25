'use client';

import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Progress } from '@/components/ui/Progress';
import { QuizGenerationRequest, QuizPayload } from '@/types/quiz';

interface QuizGeneratorProps {
  onQuizGenerated: (quiz: QuizPayload) => void;
}

const validationSchema = Yup.object({
  mode: Yup.string().required('Please select a mode'),
  subject: Yup.string().when('mode', {
    is: 'manual',
    then: (schema) => schema.required('Subject is required'),
  }),
  numProblems: Yup.number()
    .min(1, 'Must be at least 1')
    .max(50, 'Must be at most 50')
    .required('Number of problems is required'),
  difficulty: Yup.string().required('Difficulty is required'),
  focusArea: Yup.string().when('mode', {
    is: 'manual',
    then: (schema) => schema.required('Focus area is required'),
  }),
});

export default function QuizGenerator({ onQuizGenerated }: QuizGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, PNG, or JPG/JPEG file.');
        return;
      }
      
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File size must be less than 10MB.');
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const handleSubmit = async (values: any) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      let request: QuizGenerationRequest;

      if (values.mode === 'manual') {
        request = {
          mode: 'manual',
          subject: values.subject,
          grade: values.grade,
          numProblems: values.numProblems,
          focusArea: values.focusArea,
          difficulty: values.difficulty,
        };
      } else {
        if (!uploadedFile) {
          throw new Error('Please upload a file');
        }

        const base64 = await fileToBase64(uploadedFile);
        request = {
          mode: 'upload',
          fileName: uploadedFile.name,
          fileType: uploadedFile.type.split('/')[1] as any,
          fileBase64: base64,
          numProblems: values.numProblems,
          difficulty: values.difficulty,
        };
      }

      // Simulate ~5 seconds of progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 2;
        });
      }, 100);

      // TODO: Replace with actual API call
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const quiz: QuizPayload = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        onQuizGenerated(quiz);
      }, 500);

    } catch (error) {
      console.error('Error generating quiz:', error);
      let errorMessage = 'Failed to generate quiz. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('model_not_found')) {
          errorMessage = 'OpenAI model not available. Please check your API key and plan.';
        } else if (error.message.includes('rate_limit')) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('insufficient_quota')) {
          errorMessage = 'OpenAI quota exceeded. Please check your account balance.';
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="mb-6 text-2xl font-semibold text-gray-900">
          Generate Quiz
        </h2>

        {isGenerating && (
          <div className="mb-6">
            <div className="text-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Building your quiz...
              </h3>
              <p className="text-sm text-gray-600">
                Our AI is creating engaging questions just for you
              </p>
            </div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Formik
          initialValues={{
            mode: 'manual',
            subject: '',
            grade: '',
            numProblems: 10,
            focusArea: '',
            difficulty: 'moderate',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue }) => (
            <Form className="space-y-6">
              {/* Mode Selection */}
              <div>
                <Label className="mb-2 block">Quiz Generation Mode</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="manual"
                      checked={values.mode === 'manual'}
                      onChange={(e) => setFieldValue('mode', e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-gray-900">Manual Input</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="upload"
                      checked={values.mode === 'upload'}
                      onChange={(e) => setFieldValue('mode', e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-gray-900">File Upload</span>
                  </label>
                </div>
              </div>

              {values.mode === 'manual' ? (
                /* Manual Mode Fields */
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Field
                      id="subject"
                      name="subject"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="e.g., Mathematics, Science, History"
                    />
                    {errors.subject && touched.subject && (
                      <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="grade">Grade Level (Optional)</Label>
                    <Select
                      id="grade"
                      name="grade"
                      value={values.grade}
                      onValueChange={(value) => setFieldValue('grade', value)}
                    >
                      <option value="">Select grade level</option>
                      <option value="K-5">K-5</option>
                      <option value="6-8">6-8</option>
                      <option value="9-12">9-12</option>
                      <option value="College">College</option>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="focusArea">Focus Area</Label>
                    <Field
                      id="focusArea"
                      name="focusArea"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="e.g., Algebra, World War II, Photosynthesis"
                    />
                    {errors.focusArea && touched.focusArea && (
                      <p className="mt-1 text-sm text-red-600">{errors.focusArea}</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Upload Mode Fields */
                <div>
                  <Label htmlFor="file">Upload File</Label>
                  <input
                    id="file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}

                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                  {uploadedFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {uploadedFile.name}
                    </p>
                  )}
                </div>
              )}

              {/* Common Fields */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="numProblems">Number of Questions</Label>
                                      <Field
                      id="numProblems"
                      name="numProblems"
                      type="number"
                      min="1"
                      max="50"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  {errors.numProblems && touched.numProblems && (
                    <p className="mt-1 text-sm text-red-600">{errors.numProblems}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    id="difficulty"
                    name="difficulty"
                    value={values.difficulty}
                    onValueChange={(value) => setFieldValue('difficulty', value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="moderate">Moderate</option>
                    <option value="challenging">Challenging</option>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Building Quiz...
                  </div>
                ) : (
                  'Generate Quiz'
                )}
              </Button>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
}
