/**
 * Form validation utilities
 */

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Email validation
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  
  return { valid: true }
}

/**
 * Password validation
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' }
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' }
  }
  
  return { valid: true }
}

/**
 * Required field validation
 */
export function validateRequired(value: string, fieldName: string): { valid: boolean; error?: string } {
  if (!value || value.trim() === '') {
    return { valid: false, error: `${fieldName} is required` }
  }
  return { valid: true }
}

/**
 * Number validation
 */
export function validateNumber(
  value: string | number,
  fieldName: string,
  min?: number,
  max?: number
): { valid: boolean; error?: string } {
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` }
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` }
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName} must not exceed ${max}` }
  }
  
  return { valid: true }
}

/**
 * Phone validation (basic international format)
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' }
  }
  
  // Basic international phone validation (allows +, digits, spaces, hyphens, parentheses)
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { valid: false, error: 'Invalid phone number format' }
  }
  
  return { valid: true }
}

/**
 * Login form validation
 */
export function validateLoginForm(email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {}
  
  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error!
  }
  
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error!
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Signup form validation
 */
export function validateSignupForm(
  name: string,
  email: string,
  password: string
): ValidationResult {
  const errors: Record<string, string> = {}
  
  const nameValidation = validateRequired(name, 'Name')
  if (!nameValidation.valid) {
    errors.name = nameValidation.error!
  }
  
  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    errors.email = emailValidation.error!
  }
  
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error!
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Property form validation
 */
export function validatePropertyForm(data: {
  title: string
  description: string
  price: string
  location: string
  bedrooms: string
  bathrooms: string
  area: string
}): ValidationResult {
  const errors: Record<string, string> = {}
  
  const titleValidation = validateRequired(data.title, 'Title')
  if (!titleValidation.valid) {
    errors.title = titleValidation.error!
  }
  
  const descValidation = validateRequired(data.description, 'Description')
  if (!descValidation.valid) {
    errors.description = descValidation.error!
  }
  
  const locationValidation = validateRequired(data.location, 'Location')
  if (!locationValidation.valid) {
    errors.location = locationValidation.error!
  }
  
  const priceValidation = validateNumber(data.price, 'Price', 0)
  if (!priceValidation.valid) {
    errors.price = priceValidation.error!
  }
  
  const bedroomsValidation = validateNumber(data.bedrooms, 'Bedrooms', 0, 100)
  if (!bedroomsValidation.valid) {
    errors.bedrooms = bedroomsValidation.error!
  }
  
  const bathroomsValidation = validateNumber(data.bathrooms, 'Bathrooms', 0, 100)
  if (!bathroomsValidation.valid) {
    errors.bathrooms = bathroomsValidation.error!
  }
  
  const areaValidation = validateNumber(data.area, 'Area', 0)
  if (!areaValidation.valid) {
    errors.area = areaValidation.error!
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}
