import WelcomeEmail from "@components/EmailTemplates/welcome";
import { setCookies } from "@lib/backend/auth/cookies";
import { storeSession } from "@lib/backend/auth/session";
import { generateToken } from "@lib/backend/auth/token";
import { parloculaAppURL, predefinedShelves } from "@lib/shared/constants";
import { postHandler } from "@lib/backend/helpers/handlers";
import { storeUserMetaInCache } from "@lib/backend/redis/messaging";
import { sendEmail } from "@lib/backend/actions/email";
import { registerUserSchemaServer } from "@lib/shared/validation/schemas";
import { parloId } from "@lib/shared/utils";
import { Shelf, User } from "@model";
import { render } from "@react-email/components";
import { CurrentUser, TokenPayload } from "@type/internal";
import { PredefinedShelves } from "@type/models";
import { UserSchemaType } from "@type/schemas";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// export const runtime = "nodejs"

export const POST = postHandler<UserSchemaType>({
  handler: async ({ data, frames, session, isNsfw }) => {
    const { name, dob, email, bio, username, bioLinks } = data;


    const passkey = crypto.randomUUID().replace(/-/g, '');
    const encryptedPasskey = await bcrypt.hash(
      passkey,
      await bcrypt.genSalt(10)
    );


    const session_id = crypto.randomUUID();

    const response = await User.create([{
      name,
      bio,
      bioLinks,
      username,
      email,
      dob,
      passkey: encryptedPasskey,
      profile: frames[0],
      session_id,
      filterContent: true,
    }], {
      session,
      ordered: true,
    });

    const user = response[0];

    if (!user) return { success: false, errCode: "data_storing_fail" };

    const user_id = user._id;

    const shelvesToCreate = predefinedShelves.map((s) => ({
      _id: parloId(),
      name: s,
      user_id,
      isPrivate: s !== "recommended",
      shelfKey:
        s === "recommended" ? undefined : crypto.randomUUID().replace(/-/g, ''),
      item_count: 0,
      last_order: 0,
      shelf_type: s,
    }));

    const shelves = await Shelf.insertMany(shelvesToCreate, { session, throwOnValidationError: true });

    if (!shelves || !Array.isArray(shelves)) return { success: false, errCode: "data_storing_fail" }

    const tokenPayload: TokenPayload & { email: string } = {
      user_id,
      username,
      email,
      isBanned: false,
      banEndsAt: undefined,
      profile: user.profile,
      filterContent: true,
      dob,
    }

    const sessionStored = await storeSession(session_id, tokenPayload);

    if (!sessionStored) return { success: false, errCode: "session_store_fail" };

    const token = await generateToken(tokenPayload);

    const jar = await cookies();

    setCookies(jar, "token", token);
    setCookies(jar, "sid", session_id);

    if (!(process.env.NODE_ENV === "test" || process.env.IS_TESTING)) {
      const template = await render(WelcomeEmail({ passkey }));

      await sendEmail({ email, template, subject: "Welcome to Parlocula" });
    }

    await storeUserMetaInCache({ _id: user._id, username: user.username, profile: user.profile });

    const result: CurrentUser = {
      _id: user_id,
      name: user.name,
      username: user.username,
      email: user.email,
      profile: user.profile,
      bio: user.bio,
      dob: user.dob,
      bioLinks: user.bioLinks,
      followers: 0,
      following: 0,
      posts: 0,
      comments: 0,
      publicShelves: 0,
      predefinedShelves: shelves.map(({ name, _id, poster, shelf_type, isPrivate, last_added, shelfKey }) => ({
        name: name as PredefinedShelves,
        _id: String(_id),
        poster,
        shelf_type,
        isPrivate,
        last_added,
        shelfKey,
      })),
      filterContent: true,
      tempBanned: 0,
    };

    return {
      result,
      success: true,
      available: "registration_email_username",
      options: { email, username },
      warnTeamParlocula: isNsfw ? {
        title: "The Profile Picture of this user may be NSFW",
        desc: "",
        path: `${parloculaAppURL}/u/${user.username}`
      } : undefined,
    };
  },
  schema: registerUserSchemaServer,
  skipUserCheck: true,
});
