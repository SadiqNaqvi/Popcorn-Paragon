"use server";

import BugOrSuggestionTemplate from "@components/EmailTemplates/BugOrSuggestion";
import VerifyEmail from "@components/EmailTemplates/verification";
import { oneHourInSeconds } from "@lib/shared/constants";
import { getRedis } from "@lib/backend/providers/redis";
import { reportOrSuggestionSchemaServer, verificationCodeSchema } from "@lib/shared/validation/schemas";
import { getTimeInFuture } from "@lib/shared/utils";
import { render } from "@react-email/components";
import { GeneralGetReturn, GeneralPostReturn } from "@type/internal";
import { AppBugOrSuggestionSchemaServer } from "@type/schemas";
import { randomInt } from "crypto";
import { createTransport } from "nodemailer";

const transportor = createTransport({
  service: "gmail",
  auth: {
    user: process.env.QCORE_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

type EmailPayload = {
  code: number;
  expiresOn: number;
  triedTimes: number;
}

type SendEmailProps = {
  template: string;
  email: string;
  subject: string;
}

export const sendEmail = async ({ email, subject, template }: SendEmailProps) => {

  await transportor.sendMail({
    from: process.env.QCORE_EMAIL,
    to: email,
    subject,
    html: template,
  });
}

export const reportBugOrSuggestion = async (payload: AppBugOrSuggestionSchemaServer) => {
  const { success, data, error } = reportOrSuggestionSchemaServer.safeParse(payload);

  if (!success) return { success, errors: error.issues };
  try {
    await sendEmail({
      email: process.env.CREATOR_EMAIL!,
      subject: `${data.type} on ${data.page}`,
      template: await render(BugOrSuggestionTemplate(data))
    });

    return { success: true }
  } catch (e) {
    console.error("Error while reporting bug or suggestion", e);
    return { success: false, errors: ["Something went wrong! Please try again."] }
  }
}

export const sendVerificationCode = async (
  email: string,
  fingerprint: string,
): Promise<GeneralGetReturn> => {
  if (!fingerprint) throw new Error("Fingerprint is not passed");

  if (process.env.NODE_ENV === "test" || process.env.IS_TESTING) return {
    success: true,
    result: null,
  }

  const redis = await getRedis();

  const payload: EmailPayload | null = await redis
    .get(`limits:email:${fingerprint}`)
    .then(r => JSON.parse(r ?? "null"));

  if (payload && payload.triedTimes >= 5)
    return { success: false, errCode: "email_verification_limit_exceed" }

  try {

    const code = randomInt(100000, 1000000);

    const template = await render(VerifyEmail({ code }));

    await sendEmail({ email, template, subject: "Email Verification" });

    const triedTimes = payload?.triedTimes ?? 0;
    const updatedPayload: EmailPayload = {
      code,
      expiresOn: getTimeInFuture({ unit: "m", timeVal: 5 }),
      triedTimes: triedTimes + 1,
    };

    await redis.setex(
      `limits:email:${fingerprint}`,
      oneHourInSeconds,
      JSON.stringify(updatedPayload));

    return { success: true, result: null };

  } catch (err: any) {
    console.warn("Error occured while sending verification email", err.message);
    return { success: false, errCode: "unknown_error" };
  }
};

export const verifyCode = async (code: string | number, fingerprint: string): Promise<GeneralPostReturn> => {
  try {

    const { success, data, error } = verificationCodeSchema.safeParse(`${code}`);

    if (!success)
      return { success: false, errCode: "form_error", formError: error.issues }

    if (process.env.NODE_ENV === "test" || process.env.IS_TESTING) {
      if (data === 123456) return {
        success: true,
        result: null
      }
      else return {
        success: false,
        errCode: "invalid_verification_code"
      }
    }

    const redis = await getRedis();

    const payload: EmailPayload | null = await redis
      .get(`limits:email:${fingerprint}`)
      .then(r => JSON.parse(r ?? "null"));

    if (!payload || payload.expiresOn < Date.now())
      return { success: false, errCode: "verification_code_expired" }

    else if (payload.code !== data)
      return { success: false, errCode: "invalid_verification_code" }

    return { success: true, result: null }

  } catch (err: any) {
    console.error("Failed to compare codes", err.message);
    return { success: false, errCode: "unknown_error" };
  }
};
