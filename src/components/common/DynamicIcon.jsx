import React from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * A component that renders either a lucide-react icon (if the name matches)
 * or the literal string (e.g., an emoji).
 */
export default function DynamicIcon({ name, className = "w-5 h-5", ...props }) {
  if (!name) return null;

  // Se o nome corresponder a um ícone exportado pelo lucide-react
  const IconComponent = LucideIcons[name];

  if (IconComponent) {
    return <IconComponent className={className} {...props} />;
  }

  // Fallback: renderizar como texto/emoji
  return <span className={className} {...props}>{name}</span>;
}
