/**
 * Formats a date to show the time (e.g., "3:45 PM")
 */
export function formatLastUpdated(date: Date | undefined): string {
  if (!date) return "";
  
  return date.toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}