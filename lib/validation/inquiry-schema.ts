import { z } from "zod";

export const inquirySchema = z.object({
  playerSlug: z.string().min(1).max(64),
  companyName: z.string().min(1).max(128),
  contactName: z.string().min(1).max(64),
  contactEmail: z.string().email().max(128),
  message: z.string().min(1).max(4000),
  turnstileToken: z.string().min(1),
});

export type InquiryPayload = z.infer<typeof inquirySchema>;
