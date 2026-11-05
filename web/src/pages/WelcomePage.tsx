import { AppLoading } from "@/app/AppLoading"
import { useInvestorFilterOptions } from "@/features/investors/hooks/useInvestorFilterOptions"
import { OnboardingSurvey } from "@/features/onboarding"

/** The first-run survey, straight after sign-up. Its choices are the investors' own filter values. */
export default function WelcomePage() {
  const options = useInvestorFilterOptions()

  // Without the filter values the survey still works: those questions just have nothing to pick.
  if (options.isPending) {
    return <AppLoading />
  }

  return (
    <OnboardingSurvey
      options={{
        stages: options.data?.stages ?? [],
        industries: options.data?.industries ?? [],
        geographies: options.data?.geographies ?? [],
      }}
    />
  )
}
