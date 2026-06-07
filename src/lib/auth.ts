import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM!,
      async sendVerificationRequest({ identifier: email, url }) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: email,
          subject: "Sign in to English Helper",
          html: `<p>Click the link below to sign in:</p><p><a href="${url}">${url}</a></p>`,
        });
      },
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/auth/signin",
  },
};
