import AuthScreen from "@/features/auth/components/AuthScreen"

export default function LoginPage() {
  // Auth Flow: shared auth screen in login mode for local + Google entry points.
  return <AuthScreen initialMode="login" />
}
