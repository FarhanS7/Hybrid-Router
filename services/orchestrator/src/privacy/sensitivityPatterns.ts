export const SENSITIVITY_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  apiKey: {
    openai: /sk-[a-zA-Z0-9]{48}/g,
    google: /AIza[0-9A-Za-z-_]{35}/g,
    github: /ghp_[a-zA-Z0-9]{36}/g,
    slack: /xox[baprs]-[a-zA-Z0-9-]{10,}/g,
  },
  secrets: /\b(password|token|api_key|secret|credential)\s*[:=]\s*["']?[a-zA-Z0-9!@#$%^&*()_+=-]{4,}["']?/gi,
};
