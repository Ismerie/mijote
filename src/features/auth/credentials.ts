export const MIN_PASSWORD_LENGTH = 8;

export type Credentials = { email: string; password: string };

// Lit l'email et le mot de passe envoyés par le formulaire.
export function readCredentials(formData: FormData): Credentials {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

// Renvoie un message d'erreur à afficher, ou null si les champs sont valides.
export function validateCredentials({ email, password }: Credentials): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Saisis une adresse email valide.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  return null;
}
