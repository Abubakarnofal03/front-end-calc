import Groq from 'groq-sdk'

// Add better error handling for missing API key
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY

if (!groqApiKey) {
  console.error('Missing VITE_GROQ_API_KEY environment variable')
}

const groq = groqApiKey ? new Groq({
  apiKey: groqApiKey,
  dangerouslyAllowBrowser: true
}) : null

export interface LearningPlan {
  days: {
    day: number
    title: string
    subtopics: string[]
    explanations: string[]
  }[]
}

export interface UserProfile {
  highest_qualification: string
  specialization: string
  profession: string
  learning_preferences: {
    includeCode: boolean
    preferredExampleTypes: string[]
    focusAreas: string[]
  }
}

// Helper function to clean JSON response from markdown code blocks
function cleanJsonResponse(content: string): string {
  // Remove markdown code block wrapper if present
  let trimmed = content.trim()
  
  // Handle ```json at the start
  if (trimmed.startsWith('```json')) {
    trimmed = trimmed.slice(7).trim()
  }
  // Handle ``` at the start
  else if (trimmed.startsWith('```')) {
    trimmed = trimmed.slice(3).trim()
  }
  
  // Handle ``` at the end
  if (trimmed.endsWith('```')) {
    trimmed = trimmed.slice(0, -3).trim()
  }
  
  return trimmed
}

// Helper function to fix common JSON escaping issues
function fixJsonEscaping(jsonString: string): string {
  try {
    // First, try to parse as-is
    JSON.parse(jsonString)
    return jsonString
  } catch (error) {
    // If parsing fails, attempt to fix common issues
    let fixed = jsonString
    
    // Fix template literal backticks - this is the main issue
    // Handle multi-line content with backticks
    fixed = fixed.replace(/"content":\s*`([^`]*(?:\\.[^`]*)*)`/gs, (match, content) => {
      // Properly escape the content for JSON
      const escapedContent = content
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/"/g, '\\"')    // Escape quotes
        .replace(/\n/g, '\\n')   // Escape newlines
        .replace(/\r/g, '\\r')   // Escape carriage returns
        .replace(/\t/g, '\\t')   // Escape tabs
        .replace(/\f/g, '\\f')   // Escape form feeds
        .replace(/\b/g, '\\b')   // Escape backspaces
      
      return `"content": "${escapedContent}"`
    })
    
    // Handle any other field with backticks
    fixed = fixed.replace(/"(\w+)":\s*`([^`]*(?:\\.[^`]*)*)`/gs, (match, fieldName, content) => {
      const escapedContent = content
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\f/g, '\\f')
        .replace(/\b/g, '\\b')
      
      return `"${fieldName}": "${escapedContent}"`
    })
    
    // Fix unescaped content in JSON strings (for regular quoted strings)
    fixed = fixed.replace(/"content":\s*"([^"]*(?:\\.[^"]*)*)"/, (match, content) => {
      // Don't double-escape already escaped content
      if (content.includes('\\n') || content.includes('\\"')) {
        return match
      }
      
      // Properly escape the content
      const escapedContent = content
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/"/g, '\\"')    // Escape quotes
        .replace(/\n/g, '\\n')   // Escape newlines
        .replace(/\r/g, '\\r')   // Escape carriage returns
        .replace(/\t/g, '\\t')   // Escape tabs
        .replace(/\f/g, '\\f')   // Escape form feeds
        .replace(/\b/g, '\\b')   // Escape backspaces
      
      return `"content": "${escapedContent}"`
    })
    
    // Fix answer field with unescaped content
    fixed = fixed.replace(/"answer":\s*"([^"]*(?:\\.[^"]*)*)"/, (match, content) => {
      // Don't double-escape already escaped content
      if (content.includes('\\n') || content.includes('\\"')) {
        return match
      }
      
      // Properly escape the content
      const escapedContent = content
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/"/g, '\\"')    // Escape quotes
        .replace(/\n/g, '\\n')   // Escape newlines
        .replace(/\r/g, '\\r')   // Escape carriage returns
        .replace(/\t/g, '\\t')   // Escape tabs
        .replace(/\f/g, '\\f')   // Escape form feeds
        .replace(/\b/g, '\\b')   // Escape backspaces
      
      return `"answer": "${escapedContent}"`
    })
    
    // Remove markdown-style list markers from the beginning of lines in JSON fields
    fixed = fixed.replace(/"content":\s*"([^"]*)"/g, (_, content) => {
      // Remove leading * or - or whitespace from each line
      const cleaned = content.replace(/^[\s*-]+/gm, '');
      return `"content": "${cleaned}"`;
    });
    
    // Handle truncated JSON - if it doesn't end with }, try to close it properly
    if (!fixed.trim().endsWith('}') && !fixed.trim().endsWith(']')) {
      // Find the last complete field and close the JSON
      const lastCompleteFieldMatch = fixed.match(/.*"[^"]+"\s*:\s*(?:"[^"]*"|[^,}]+)(?=\s*[,}])/s)
      if (lastCompleteFieldMatch) {
        const lastCompleteIndex = lastCompleteFieldMatch.index + lastCompleteFieldMatch[0].length
        fixed = fixed.substring(0, lastCompleteIndex) + '}'
      } else {
        // If we can't find a complete field, try to find the opening brace and close it
        const openBraceIndex = fixed.indexOf('{')
        if (openBraceIndex >= 0) {
          // Find the last comma or opening brace
          const lastCommaIndex = fixed.lastIndexOf(',')
          const cutIndex = lastCommaIndex > openBraceIndex ? lastCommaIndex : openBraceIndex + 1
          fixed = fixed.substring(0, cutIndex) + '}'
        }
      }
    }
    
    return fixed
  }
}

// Helper function to create personalized prompts based on user profile
function createPersonalizedPrompt(basePrompt: string, userProfile?: UserProfile): string {
  if (!userProfile) return basePrompt

  let personalizedPrompt = basePrompt

  // Add profession-specific context
  if (userProfile.profession) {
    const professionContext = getProfessionContext(userProfile.profession)
    personalizedPrompt += `\n\nIMPORTANT: Tailor content for a ${professionContext.title}. ${professionContext.guidance}`
  }

  // Add code preference
  if (!userProfile.learning_preferences.includeCode) {
    personalizedPrompt += '\n\nIMPORTANT: Do NOT include code examples or technical snippets. Focus on conceptual explanations, real-world applications, and business/practical perspectives.'
  } else {
    personalizedPrompt += '\n\nInclude relevant code examples and technical snippets where appropriate.'
  }

  // Add preferred example types
  if (userProfile.learning_preferences.preferredExampleTypes.length > 0) {
    personalizedPrompt += `\n\nPreferred example types: ${userProfile.learning_preferences.preferredExampleTypes.join(', ')}.`
  }

  // Add focus areas
  if (userProfile.learning_preferences.focusAreas.length > 0) {
    personalizedPrompt += `\n\nFocus on: ${userProfile.learning_preferences.focusAreas.join(', ')}.`
  }

  return personalizedPrompt
}

function getProfessionContext(profession: string): { title: string; guidance: string } {
  const contexts = {
    'healthcare-professional': {
      title: 'healthcare professional',
      guidance: 'Focus on practical applications in healthcare, patient care improvements, and regulatory compliance. Avoid technical code examples.'
    },
    'business-manager': {
      title: 'business manager',
      guidance: 'Emphasize business value, ROI, strategic implications, and management perspectives. Use business case studies and avoid technical implementation details.'
    },
    'software-developer': {
      title: 'software developer',
      guidance: 'Include detailed code examples, technical implementation details, best practices, and architectural considerations.'
    },
    'data-scientist': {
      title: 'data scientist',
      guidance: 'Focus on data analysis applications, statistical concepts, and include relevant code examples for data processing and visualization.'
    },
    'designer': {
      title: 'designer',
      guidance: 'Emphasize user experience, visual design principles, and creative applications. Focus on design thinking and user-centered approaches.'
    },
    'educator': {
      title: 'educator',
      guidance: 'Focus on pedagogical applications, teaching methodologies, and educational technology. Emphasize how concepts can be taught to others.'
    },
    'consultant': {
      title: 'consultant',
      guidance: 'Emphasize strategic applications, client value, and implementation frameworks. Focus on business impact and consulting methodologies.'
    }
  }

  return contexts[profession as keyof typeof contexts] || {
    title: 'professional',
    guidance: 'Provide balanced content with both theoretical and practical perspectives.'
  }
}

// Fallback function for when Groq is not available
function createFallbackLearningPlan(topic: string, durationDays: number): LearningPlan {
  const days = []
  for (let i = 1; i <= Math.min(durationDays, 7); i++) {
    days.push({
      day: i,
      title: `Day ${i}: Introduction to ${topic}`,
      subtopics: [
        `Basic concepts of ${topic}`,
        `Getting started with ${topic}`,
        `Practical applications`
      ],
      explanations: [
        `Learn the fundamental concepts and principles of ${topic}.`,
        `Set up your development environment and create your first project.`,
        `Explore real-world applications and use cases.`
      ]
    })
  }
  return { days }
}

export async function generateLearningPlan(
  topic: string,
  durationDays: number,
  level: string,
  dailyTime: string,
  userProfile?: UserProfile
): Promise<LearningPlan> {
  if (!groq) {
    console.warn('Groq API not available, using fallback learning plan')
    return createFallbackLearningPlan(topic, durationDays)
  }

  const basePrompt = `Create a ${durationDays}-day learning plan for "${topic}" for a ${level} learner who can study ${dailyTime} daily.

IMPORTANT: Provide only brief overviews (1-2 sentences) for each subtopic explanation. The detailed content will be fetched separately when needed.

Return ONLY a JSON object with this exact structure:
{
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "subtopics": ["subtopic1", "subtopic2", "subtopic3"],
      "explanations": ["Brief overview of subtopic1", "Brief overview of subtopic2", "Brief overview of subtopic3"]
    }
  ]
}

Each day should have 3-5 subtopics with brief explanations (1-2 sentences each). Keep explanations concise as detailed content will be loaded on-demand.`

  const personalizedPrompt = createPersonalizedPrompt(basePrompt, userProfile)

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: personalizedPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 8000
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No response from Groq API')

    const cleanedContent = cleanJsonResponse(content)
    return JSON.parse(cleanedContent)
  } catch (error) {
    console.error('Error generating learning plan:', error)
    console.warn('Falling back to default learning plan')
    return createFallbackLearningPlan(topic, durationDays)
  }
}

export async function getDetailedSubtopicContent(
  topic: string,
  dayTitle: string,
  subtopic: string,
  level: string,
  userProfile?: UserProfile
): Promise<{
  content: string
  keyPoints: string[]
  examples: string[]
  practicalApplications: string[]
}> {
  if (!groq) {
    return {
      content: `# ${subtopic}\n\nThis is a detailed explanation of ${subtopic} in the context of ${topic}. The content would normally be generated by AI, but the API is not currently available.`,
      keyPoints: [`Key concept 1 about ${subtopic}`, `Key concept 2 about ${subtopic}`],
      examples: [`Example 1 for ${subtopic}`, `Example 2 for ${subtopic}`],
      practicalApplications: [`Application 1 of ${subtopic}`, `Application 2 of ${subtopic}`]
    }
  }

  const basePrompt = `Create comprehensive educational content for this subtopic. Focus on clear, well-structured explanations.

Main Topic: ${topic}
Day: ${dayTitle}
Subtopic: ${subtopic}
Level: ${level}

Create detailed content with:
- Clear explanations using proper formatting
- Use **bold** for important concepts
- Use \`code\` for inline code snippets
- Use \`\`\`language\\ncode here\\n\`\`\` for multi-line code
- Include practical examples and real-world applications
- Structure content with headers (# ## ###) where appropriate

CRITICAL: Return ONLY valid JSON with proper double quotes (no backticks). Use this exact structure:
{
  "content": "Detailed explanation with proper formatting and structure",
  "keyPoints": ["Key concept 1", "Key concept 2", "Key concept 3"],
  "examples": ["Practical example 1", "Practical example 2"],
  "practicalApplications": ["Real-world application 1", "Real-world application 2"]
}

Make the content comprehensive, educational, and well-formatted. Ensure all strings use double quotes and escape any internal quotes properly.`

  const personalizedPrompt = createPersonalizedPrompt(basePrompt, userProfile)

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: personalizedPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.6,
      max_tokens: 4000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from Groq API')

    const cleanedResponse = cleanJsonResponse(response)
    const fixedResponse = fixJsonEscaping(cleanedResponse)
    const parsed = JSON.parse(fixedResponse)
    
    // Ensure all fields are strings/arrays with proper defaults
    return {
      content: String(parsed.content || 'Content not available'),
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.filter(Boolean) : [],
      examples: Array.isArray(parsed.examples) ? parsed.examples.filter(Boolean) : [],
      practicalApplications: Array.isArray(parsed.practicalApplications) ? parsed.practicalApplications.filter(Boolean) : []
    }
  } catch (error) {
    console.error('Error parsing detailed content response:', error)
    // Enhanced fallback: try to extract content manually
    let fallbackContent = { content: '', keyPoints: [], examples: [], practicalApplications: [] };
    try {
      if (typeof response === 'string') {
        fallbackContent = extractContentFromResponse(response)
      }
    } catch (e) {
      // fallbackContent remains default
    }
    return {
      content: fallbackContent.content || 'Content could not be extracted from the response.',
      keyPoints: fallbackContent.keyPoints,
      examples: fallbackContent.examples,
      practicalApplications: fallbackContent.practicalApplications
    }
  }
}

// Helper function to manually extract content when JSON parsing fails
function extractContentFromResponse(response: string): {
  content: string
  keyPoints: string[]
  examples: string[]
  practicalApplications: string[]
} {
  // Try to extract content between backticks or quotes
  const contentMatch = response.match(/"content":\s*[`"]([^`"]*(?:\\.[^`"]*)*)[`"]/s)
  const keyPointsMatch = response.match(/"keyPoints":\s*\[(.*?)\]/s)
  const examplesMatch = response.match(/"examples":\s*\[(.*?)\]/s)
  const practicalMatch = response.match(/"practicalApplications":\s*\[(.*?)\]/s)
  
  // Extract arrays by splitting on commas and cleaning quotes
  const extractArray = (match: string | null): string[] => {
    if (!match) return []
    return match.split(',')
      .map(item => item.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean)
  }
  
  return {
    content: contentMatch ? contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : 'Content could not be extracted from the response.',
    keyPoints: extractArray(keyPointsMatch ? keyPointsMatch[1] : null),
    examples: extractArray(examplesMatch ? examplesMatch[1] : null),
    practicalApplications: extractArray(practicalMatch ? practicalMatch[1] : null)
  }
}

export async function generateQuizQuestions(
  dayTitle: string,
  subtopics: string[],
  explanations: string[],
  userProfile?: UserProfile
): Promise<{
  mcq: Array<{
    question: string
    options: string[]
    correct_answer: string
    explanation: string
  }>
  theory: Array<{
    question: string
    correct_answer: string
    key_points: string[]
  }>
}> {
  if (!groq) {
    return {
      mcq: [
        {
          question: `What is the main focus of ${dayTitle}?`,
          options: subtopics.slice(0, 4),
          correct_answer: subtopics[0] || 'Understanding the basics',
          explanation: 'This question tests understanding of the lesson structure.'
        }
      ],
      theory: [
        {
          question: `Explain the key concepts covered in ${dayTitle}.`,
          correct_answer: `The lesson covers: ${subtopics.join(', ')}. ${explanations.join(' ')}`,
          key_points: subtopics.slice(0, 3)
        }
      ]
    }
  }

  const content = `Day: ${dayTitle}\nSubtopics: ${subtopics.join(', ')}\nExplanations: ${explanations.join('\n\n')}`
  
  const basePrompt = `Based on this lesson content, create exactly 3 multiple choice questions and 2 theory questions.

Lesson Content:
${content}

IMPORTANT: Create questions that test actual understanding, not just memorization. Include detailed explanations for correct answers.

Return ONLY a JSON object with this exact structure (use double quotes only):
{
  "mcq": [
    {
      "question": "Specific, detailed question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Detailed explanation of why this is correct and why others are wrong"
    }
  ],
  "theory": [
    {
      "question": "Theory question requiring detailed explanation",
      "correct_answer": "Comprehensive ideal answer with key concepts",
      "key_points": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ]
}

Make questions challenging and test deep understanding of the concepts taught.`

  const personalizedPrompt = createPersonalizedPrompt(basePrompt, userProfile)

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: personalizedPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 3000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from Groq API')

    const cleanedResponse = cleanJsonResponse(response)
    const fixedResponse = fixJsonEscaping(cleanedResponse)
    const parsed = JSON.parse(fixedResponse)
    
    // Ensure proper structure with defaults
    return {
      mcq: Array.isArray(parsed.mcq) ? parsed.mcq.map(q => ({
        question: String(q.question || ''),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        correct_answer: String(q.correct_answer || ''),
        explanation: String(q.explanation || '')
      })) : [],
      theory: Array.isArray(parsed.theory) ? parsed.theory.map(q => ({
        question: String(q.question || ''),
        correct_answer: String(q.correct_answer || ''),
        key_points: Array.isArray(q.key_points) ? q.key_points.map(String) : []
      })) : []
    }
  } catch (error) {
    console.error('Error parsing quiz questions:', error)
    
    // Fallback: create basic questions
    return {
      mcq: [
        {
          question: `What is the main focus of today's lesson: ${dayTitle}?`,
          options: subtopics.slice(0, 4),
          correct_answer: subtopics[0] || 'Understanding the basics',
          explanation: 'This question tests understanding of the lesson structure.'
        }
      ],
      theory: [
        {
          question: `Explain the key concepts covered in ${dayTitle}.`,
          correct_answer: `The lesson covers: ${subtopics.join(', ')}. ${explanations.join(' ')}`,
          key_points: subtopics.slice(0, 3)
        }
      ]
    }
  }
}

export async function gradeTheoryAnswer(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  keyPoints: string[]
): Promise<{
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
}> {
  if (!groq) {
    const score = userAnswer.length > 50 ? 7 : 5
    return {
      score,
      feedback: `Your answer shows ${score >= 7 ? 'good' : 'basic'} understanding. Consider elaborating more on the key concepts.`,
      strengths: ['Attempted to answer the question'],
      improvements: ['Provide more detailed explanations', 'Include specific examples']
    }
  }

  const prompt = `Grade this theory answer on a scale of 0-10 based on accuracy, completeness, and understanding.

Question: ${question}
Correct Answer: ${correctAnswer}
Key Points to Cover: ${keyPoints.join(', ')}
User Answer: ${userAnswer}

Provide detailed, constructive feedback. Check if the user's answer covers the key concepts and demonstrates understanding.

Return ONLY a JSON object (use double quotes only):
{
  "score": 8,
  "feedback": "Detailed feedback explaining the score",
  "strengths": ["What the user did well"],
  "improvements": ["Areas for improvement"]
}

Be fair, thorough, and educational in your assessment.`

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 1000
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from Groq API')

    const cleanedResponse = cleanJsonResponse(response)
    const fixedResponse = fixJsonEscaping(cleanedResponse)
    const parsed = JSON.parse(fixedResponse)
    
    return {
      score: Math.max(0, Math.min(10, Number(parsed.score) || 0)),
      feedback: String(parsed.feedback || 'No feedback available'),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : []
    }
  } catch (error) {
    console.error('Error parsing grading response:', error)
    
    // Fallback grading
    const score = userAnswer.length > 50 ? 7 : 5
    return {
      score,
      feedback: `Your answer shows ${score >= 7 ? 'good' : 'basic'} understanding. Consider elaborating more on the key concepts.`,
      strengths: ['Attempted to answer the question'],
      improvements: ['Provide more detailed explanations', 'Include specific examples']
    }
  }
}

export async function askTutorQuestion(
  context: string,
  question: string,
  userProfile?: UserProfile
): Promise<{
  answer: string
  codeExamples?: string[]
  relatedConcepts?: string[]
  furtherReading?: string[]
}> {
  if (!groq) {
    return {
      answer: `I understand you're asking about: "${question}". While I can't provide a detailed AI-generated response right now, I recommend reviewing the lesson content and exploring the detailed explanations for each subtopic.`,
      relatedConcepts: [],
      furtherReading: []
    }
  }

  const basePrompt = `You are an AI tutor helping a student learn. Based on today's lesson context, answer their question clearly and helpfully.

Lesson Context:
${context}

Student Question: ${question}

Provide a comprehensive answer with:
- Clear explanation of the concept
- Code examples if relevant (use proper formatting)
- Related concepts they should know
- Suggestions for further learning

Format your response with proper structure including **bold** for emphasis, \`code\` for inline code, and \`\`\`language\ncode\n\`\`\` for code blocks.

Return ONLY a JSON object (use double quotes only):
{
  "answer": "Detailed formatted answer with proper markdown formatting",
  "codeExamples": ["example1", "example2"],
  "relatedConcepts": ["concept1", "concept2"],
  "furtherReading": ["resource1", "resource2"]
}

Make the response educational and engaging.`

  const personalizedPrompt = createPersonalizedPrompt(basePrompt, userProfile)

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: personalizedPrompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.6,
      max_tokens: 2500
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from Groq API')

    const cleanedResponse = cleanJsonResponse(response)
    const fixedResponse = fixJsonEscaping(cleanedResponse)
    const parsed = JSON.parse(fixedResponse)
    
    // Ensure all fields are properly formatted
    return {
      answer: String(parsed.answer || ''),
      codeExamples: Array.isArray(parsed.codeExamples) ? parsed.codeExamples : [],
      relatedConcepts: Array.isArray(parsed.relatedConcepts) ? parsed.relatedConcepts : [],
      furtherReading: Array.isArray(parsed.furtherReading) ? parsed.furtherReading : []
    }
  } catch (error) {
    console.error('Error parsing tutor response:', error)
    
    // Fallback: return a basic structure with the raw content
    return {
      answer: completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.',
      relatedConcepts: [],
      furtherReading: []
    }
  }
}