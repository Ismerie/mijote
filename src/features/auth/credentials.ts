export const MIN_PASSWORD_LENGTH = 8;

export type Credentials = { email: string; password: string };

// Lit l'email et le mot de passe envoyés par le formulaire.
export function readCredentials(formData: FormData): Credentials {
  return {
    email: readEmail(formData),
    password: String(formData.get("password") ?? ""),
  };
}

// Lit l'email seul (mot de passe oublié).
export function readEmail(formData: FormData): string {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}

// Renvoie un message d'erreur à afficher, ou null si l'email est valide.
export function validateEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Saisis une adresse email valide.";
  }
  return null;
}

// Renvoie un message d'erreur à afficher, ou null si le mot de passe est assez long.
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  return null;
}

// Renvoie un message d'erreur à afficher, ou null si les champs sont valides.
export function validateCredentials({ email, password }: Credentials): string | null {
  return validateEmail(email) ?? validatePassword(password);
}
