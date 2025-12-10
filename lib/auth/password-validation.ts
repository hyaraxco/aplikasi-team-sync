/**
 * Password validation utilities for enhanced security
 */

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
}

export interface PasswordRequirements {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSymbols: boolean
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
}

/**
 * Validates password against security requirements
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const errors: string[] = []
  let strengthScore = 0

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`)
  } else {
    strengthScore += 1
  }

  // Check for uppercase letters
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else if (/[A-Z]/.test(password)) {
    strengthScore += 1
  }

  // Check for lowercase letters
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else if (/[a-z]/.test(password)) {
    strengthScore += 1
  }

  // Check for numbers
  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else if (/\d/.test(password)) {
    strengthScore += 1
  }

  // Check for symbols
  if (requirements.requireSymbols && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)')
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    strengthScore += 1
  }

  // Additional strength checks
  if (password.length >= 12) strengthScore += 1
  if (/(.)\1{2,}/.test(password)) strengthScore -= 1 // Penalize repeated characters

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong'
  if (strengthScore <= 2) {
    strength = 'weak'
  } else if (strengthScore <= 4) {
    strength = 'medium'
  } else {
    strength = 'strong'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

/**
 * Get password strength color for UI display
 */
export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'strong':
      return 'text-green-500'
    default:
      return 'text-gray-500'
  }
}

/**
 * Get password requirements as a formatted list for display
 */
export function getPasswordRequirementsText(
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): string[] {
  const texts: string[] = []
  
  texts.push(`At least ${requirements.minLength} characters`)
  
  if (requirements.requireUppercase) {
    texts.push('At least one uppercase letter (A-Z)')
  }
  
  if (requirements.requireLowercase) {
    texts.push('At least one lowercase letter (a-z)')
  }
  
  if (requirements.requireNumbers) {
    texts.push('At least one number (0-9)')
  }
  
  if (requirements.requireSymbols) {
    texts.push('At least one special character (!@#$%^&*)')
  }
  
  return texts
}
