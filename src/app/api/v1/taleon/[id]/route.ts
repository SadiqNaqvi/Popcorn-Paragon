import { getHandler, postHandler, updateHandler } from "@lib/backend/helpers/handlers";
import { Taleon } from "@model";
import { TaleonSchemaType } from "@type/schemas";

// Get taleon by id
export const GET = getHandler(async (_, params) => {
  const { id } = params;
  const taleonDoc = await Taleon.findOne({ ext_id: id });

  if (!taleonDoc) return { success: false, errCode: "resource_not_found" };
  return { result: taleonDoc, success: true };
});

// Store taleon 
export const POST = postHandler<TaleonSchemaType>({
  handler: async ({ data, params, session }) => {

    const { id } = params;

    const taleonDoc = await Taleon.create(
      [{ ...data, editedAt: Date.now() }],
      { session }
    );

    if (!taleonDoc) return {
      success: false, errCode: "data_storing_fail"
    }

    return {
      result: taleonDoc,
      success: true,
      available: "taleon_extid",
      options: { extid: id },
    };
  },
  skipUserCheck: true,
});

// Update taleon every 5 days
export const PATCH = updateHandler<TaleonSchemaType>({
  handler: async ({ data, params, session }) => {

    const { id } = params;

    const taleonDoc = await Taleon.findOneAndUpdate(
      { ext_id: id },
      { ...data, editedAt: Date.now() },
      { session }
    );

    if (!taleonDoc) return {
      success: false, errCode: "data_storing_fail"
    }

    return {
      result: taleonDoc,
      success: true,
      available: "taleon_extid",
      options: { extid: id },
    };
  },
  skipUserCheck: true,
});
