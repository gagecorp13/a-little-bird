import { InfoPage } from "@/components/InfoPage";
import { RecipientAction } from "@/components/RecipientAction";
export const metadata = {
  title: "report a message — a little bird",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <InfoPage title="tell us something’s wrong.">
      <RecipientAction purpose="report" />
    </InfoPage>
  );
}
