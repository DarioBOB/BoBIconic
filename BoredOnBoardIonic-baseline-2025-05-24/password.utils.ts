export function isPasswordValid(password: string): boolean {
  // Au moins 8 caractères
  if (password.length < 8) return false;
  // Au moins une majuscule
  if (!/[A-Z]/.test(password)) return false;
  // Au moins une minuscule
  if (!/[a-z]/.test(password)) return false;
  // Au moins un chiffre
  if (!/[0-9]/.test(password)) return false;
  // Au moins un caractère spécial
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  return true;
}

export function doPasswordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
} 