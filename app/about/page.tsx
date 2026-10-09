import { InfoPage } from "@/components/InfoPage";
export const metadata = { title: "what is this? — a little bird" };
export default function Page() {
  return (
    <InfoPage title="a note without a signature.">
      <p>
        Some things are easier to put into words when you don’t have to put your name beneath them.
      </p>
      <p>
        A little bird carries a short note to someone’s email. You don’t need an account, and we
        don’t ask for your name or email address.
      </p>
      <h2 id="how-it-works">how it works</h2>
      <ol>
        <li>Add up to five email addresses. Each person gets a separate email.</li>
        <li>Write a plain-text note, up to 1,000 characters.</li>
        <li>Let it fly. The whole note arrives in the email, with no link to open to read it.</li>
      </ol>
      <p>
        Replies won’t reach the author. We don’t show read receipts or promise that a message will
        reach an inbox.
      </p>
      <h2>a little care goes a long way.</h2>
      <p>
        Send only to people who have agreed to receive these messages. Don’t use a little bird for
        harassment, threats, scams, or unwanted mail. Small sending limits help protect everyone.
      </p>
      <p>Every email has a link to report it and a link to stop future messages to that address.</p>
      <h2>unsigned doesn’t mean untraceable.</h2>
      <p>
        Your name and email aren’t added to a note. Its words may still reveal who wrote it, and
        service providers process network and delivery information. Our privacy page explains what
        we keep.
      </p>
    </InfoPage>
  );
}
