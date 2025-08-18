'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface MarkdownProps {
  content: string
  className?: string
}

export function Markdown({ content, className }: MarkdownProps) {
  const renderMarkdown = (text: string) => {
    // Split text into parts, preserving the original structure
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
    
    return parts.map((part, index) => {
      // Bold text with **
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2)
        return <strong key={index} className="font-semibold">{content}</strong>
      }
      
      // Italic text with *
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        const content = part.slice(1, -1)
        return <em key={index} className="italic">{content}</em>
      }
      
      // Inline code with `
      if (part.startsWith('`') && part.endsWith('`')) {
        const content = part.slice(1, -1)
        return (
          <code 
            key={index} 
            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
          >
            {content}
          </code>
        )
      }
      
      // Regular text - handle line breaks
      return part.split('\n').map((line, lineIndex, array) => (
        <React.Fragment key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < array.length - 1 && <br />}
        </React.Fragment>
      ))
    })
  }

  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      {renderMarkdown(content)}
    </div>
  )
}