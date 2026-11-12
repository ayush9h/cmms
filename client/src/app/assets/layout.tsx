import { PremiumGate } from "@/components/premium/premium-gate";

export default function Layout({ children }: any) {
  return <PremiumGate>{children}</PremiumGate>;
}
