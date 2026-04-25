import AuthScreen from "@/features/auth/components/AuthScreen"

export default function SignupPage() {
  // Auth Flow: shared auth screen in signup mode for new account onboarding.
  return <AuthScreen initialMode="signup" />
}
