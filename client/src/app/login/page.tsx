import { LoginForm } from "@/auth/login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  return <LoginForm />;
}
