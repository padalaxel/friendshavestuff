import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split('@');
  if (!domain) return email;

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // Remove dots from local part for Gmail
    return `${local.replace(/\./g, '')}@${domain}`;
  }

  return email.toLowerCase();
}
