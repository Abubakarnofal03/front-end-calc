import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface FormattedContentProps {
  content: string
  className?: string
}

export function FormattedContent({ content, className = '' }: FormattedContentProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(id)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const sanitizeAndCleanText = (text: string): string => {
    // Ensure text is a string and handle null/undefined cases
    const safeText = String(text || '')
    
    // Clean up malformed text from AI responses
    let cleanedText = safeText
      // Fix the specific 'n' issue - remove standalone 'n' at start of lines
      .replace(/^n(?=[A-Z])/gm, '')
      .replace(/\bn\b(?=[A-Z])/g, '')
      // Remove control characters and malformed escape sequences
      .replace(/[\b\x08]/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Handle various escape sequences
      .replace(/\\bn\\b/g, '\n')
      .replace(/\\bn/g, '\n')
      .replace(/\\b/g, '')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n\\n/g, '\n\n')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\t/g, '    ')
      .replace(/\\\\/g, '\\')
    
    // Remove stray backslashes
    cleanedText = cleanedText.replace(/\\[a-zA-Z]/g, '')
    
    // Normalize whitespace
    cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n')
    
    return cleanedText.trim()
  }

  const formatContent = (text: string) => {
    // First sanitize and clean the text
    const cleanText = sanitizeAndCleanText(text)
    
    // Split content by code blocks first
    const parts = cleanText.split(/(```[\s\S]*?```)/g)
    
    return parts.map((part, index) => {
      // Handle code blocks
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.slice(3, -3)
        const lines = codeContent.split('\n')
        const language = lines[0].trim()
        const code = lines.slice(1).join('\n').trim()
        const codeId = `code-${index}`
        
        return (
          <div key={index} className="my-6 relative group">
            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <span className="text-xs text-gray-400 font-mono">{language || 'code'}</span>
                <button
                  onClick={() => copyToClipboard(code, codeId)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded"
                >
                  {copiedCode === codeId ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto">
                <code className="text-sm text-gray-300 font-mono whitespace-pre">
                  {code}
                </code>
              </pre>
            </div>
          </div>
        )
      }
      
      // Handle regular text with inline formatting
      return (
        <div key={index} className="space-y-4">
          {part.split('\n').map((line, lineIndex) => {
            const trimmedLine = line.trim()
            
            // Skip empty lines but add spacing
            if (!trimmedLine) return <div key={lineIndex} className="h-2" />
            
            // Handle headers with proper spacing and styling
            if (trimmedLine.startsWith('#### ')) {
              return (
                <h5 key={lineIndex} className="text-base font-bold text-white mt-8 mb-4 font-mono border-l-2 border-blue-400 pl-3 bg-blue-400/5 py-2 rounded-r">
                  {trimmedLine.replace('#### ', '')}
                </h5>
              )
            }
            if (trimmedLine.startsWith('### ')) {
              return (
                <h4 key={lineIndex} className="text-lg font-bold text-white mt-8 mb-4 font-mono border-l-3 border-purple-400 pl-4 bg-purple-400/5 py-2 rounded-r">
                  {trimmedLine.replace('### ', '')}
                </h4>
              )
            }
            if (trimmedLine.startsWith('## ')) {
              return (
                <h3 key={lineIndex} className="text-xl font-bold text-white mt-10 mb-5 font-mono border-l-4 border-blue-500 pl-4 bg-blue-500/5 py-3 rounded-r">
                  {trimmedLine.replace('## ', '')}
                </h3>
              )
            }
            if (trimmedLine.startsWith('# ')) {
              return (
                <h2 key={lineIndex} className="text-2xl font-bold text-white mt-12 mb-6 font-mono border-b-2 border-gray-600 pb-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-3 rounded">
                  {trimmedLine.replace('# ', '')}
                </h2>
              )
            }
            
            // Process inline formatting
            let processedLine = trimmedLine
            
            // Handle math formulas
            processedLine = processedLine.replace(/\$\$(.*?)\$\$/g, (_, formula) => {
              return `<span class="inline-block px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded text-blue-200 font-mono text-sm mx-1">${formula}</span>`
            })
            
            // Handle inline code
            processedLine = processedLine.replace(/`([^`]+)`/g, (_, code) => {
              return `<code class="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-green-300 font-mono text-sm">${code}</code>`
            })
            
            // Handle bold text - improved regex to catch more cases
            processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, (_, text) => {
              return `<strong class="font-bold text-white">${text}</strong>`
            })
            
            // Handle italic text
            processedLine = processedLine.replace(/\*([^*]+)\*/g, (_, text) => {
              return `<em class="italic text-gray-200">${text}</em>`
            })
            
            // Handle bullet points with different markers and better styling
            if (trimmedLine.match(/^[-*•]\s/)) {
              const content = processedLine.replace(/^[-*•]\s/, '')
              return (
                <div key={lineIndex} className="flex items-start space-x-3 ml-6 my-3">
                  <span className="text-blue-400 mt-2 flex-shrink-0 text-base font-bold">•</span>
                  <div 
                    className="text-gray-300 leading-relaxed flex-1"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              )
            }
            
            // Handle numbered lists
            if (trimmedLine.match(/^\d+\.\s/)) {
              const number = trimmedLine.match(/^(\d+)\./)?.[1] || '1'
              const content = processedLine.replace(/^\d+\.\s/, '')
              return (
                <div key={lineIndex} className="flex items-start space-x-3 ml-6 my-3">
                  <span className="text-blue-400 mt-2 flex-shrink-0 font-mono text-sm font-bold bg-blue-400/10 px-2 py-1 rounded">
                    {number}.
                  </span>
                  <div 
                    className="text-gray-300 leading-relaxed flex-1"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              )
            }
            
            // Handle blockquotes
            if (trimmedLine.startsWith('> ')) {
              const content = processedLine.replace(/^>\s/, '')
              return (
                <div key={lineIndex} className="border-l-4 border-gray-600 pl-6 py-3 bg-gray-800/30 rounded-r my-4 ml-4">
                  <div 
                    className="text-gray-300 italic leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              )
            }
            
            // Handle regular paragraphs with better spacing
            return (
              <div 
                key={lineIndex} 
                className="text-gray-300 leading-relaxed my-4 text-sm sm:text-base"
                dangerouslySetInnerHTML={{ __html: processedLine }}
              />
            )
          })}
        </div>
      )
    })
  }

  return (
    <div className={`formatted-content ${className}`}>
      {formatContent(content)}
    </div>
  )
}