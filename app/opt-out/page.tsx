import { InfoPage } from "@/components/InfoPage";
import { RecipientAction } from "@/components/RecipientAction";
export const metadata = {
  title: "stop future emails — a little bird",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <InfoPage title="a quieter inbox.">
      <RecipientAction purpose="opt-out" />
    </InfoPage>
  );
}
