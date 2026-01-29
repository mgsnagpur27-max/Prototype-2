export const env = {
  SAMBANOVA_API_KEY: process.env.SAMBANOVA_API_KEY ?? '',
  GROQ_API_KEY: process.env.GROQ_API_KEY ?? '',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  DATABASE_URL: process.env.DATABASE_URL ?? '',
} as const;

export function validateEnv() {
  const required = ['SAMBANOVA_API_KEY', 'GROQ_API_KEY'] as const;
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }

  return missing.length === 0;
}
