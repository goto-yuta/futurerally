import { Resend } from "resend";

type Args = {
  playerName: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  message: string;
};

export async function sendInquiryEmail(args: Args): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO_EMAIL;
  if (!apiKey || !to) {
    throw new Error("RESEND_API_KEY or INQUIRY_TO_EMAIL not set");
  }
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: "FutureRally <inquiry@futurerally.example>",
    to,
    replyTo: args.contactEmail,
    subject: `[Inquiry] ${args.companyName} → ${args.playerName}`,
    text: [
      `選手: ${args.playerName}`,
      `会社: ${args.companyName}`,
      `担当: ${args.contactName} <${args.contactEmail}>`,
      "",
      "--- メッセージ ---",
      args.message,
    ].join("\n"),
  });
}
