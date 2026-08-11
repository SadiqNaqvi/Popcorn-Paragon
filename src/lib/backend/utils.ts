import { ShelfItem, Taleon } from "@model";
import { ShelfItemModelType, TaleonModelType } from "@type/models";
import type { ClientSession } from "@type/mongoose";
import { ConfirmedTaleon, TaleonSchemaType } from "@type/schemas";
import { TokenPayload } from "@type/internal";
import { AvailableRevalidateTags, CookiesType, RevalidateTagsArgs } from "@type/other";
import { verifyToken } from "@lib/backend/auth/token";

import "server-only";
import { NextRequest } from "next/server";
import { revalidateTags } from "@lib/shared/constants";

type TaleonDocType = TaleonModelType & { _id: string }

export const addItemsInShelf = async (
  items: TaleonSchemaType[],
  startingOrder: number,
  shelf_type: "custom" | "favourite" | "recommended" | "watched",
  id: string,
  user_id: string,
  session: ClientSession
): Promise<ShelfItemModelType[]> => {
  if (!items || !items.length)
    throw new Error("shelf items array, which is to be added in shelf, is empty");

  // Step 1: Separate confirmed and unconfirmed taleons
  const confirmedItems: ConfirmedTaleon[] = [];
  const unconfirmedItems: TaleonSchemaType[] = [];

  items.forEach((item) => {
    if (item.taleon_id) confirmedItems.push(item as ConfirmedTaleon);
    else unconfirmedItems.push(item);
  });

  // Step 2: Find existing items for unconfirmed items
  const extIds = unconfirmedItems.map((item) => item.ext_id);
  const existingItems: TaleonDocType[] = extIds.length
    ? await Taleon.find({ ext_id: { $in: extIds } }, { ext_id: 1 })
    : [];

  // Step 3: Create missing items and get all item IDs
  const itemsToCreate = unconfirmedItems.filter(
    (item) =>
      !existingItems.some((existing) => existing.ext_id === item.ext_id)
  );

  let createdItems: TaleonDocType[] = [];

  if (itemsToCreate.length > 0) {
    createdItems = await Taleon.create(
      itemsToCreate.map(
        (item) =>
          ({
            ext_id: item.ext_id,
            year: item.year,
            taleon_type: item.taleon_type,
            title: item.title,
            poster: item.poster,
            favourite: shelf_type === "favourite" ? 1 : 0,
            watched: shelf_type === "watched" ? 1 : 0,
            recommended: shelf_type === "recommended" ? 1 : 0,
          }) as TaleonDocType
      ),
      { session, ordered: true }
    );
  }

  // Step 4: Create a map of tmdb_id to taleon_id
  const itemIdMap = new Map<string, string>();

  // Add existing and newly created items to the map
  existingItems.concat(createdItems).forEach(({ ext_id, _id }) => {
    itemIdMap.set(ext_id, _id);
  });

  // Add Confirmed items to the map
  confirmedItems.forEach(({ ext_id, taleon_id }) => {
    itemIdMap.set(ext_id, taleon_id);
  });


  // Step 5: Create shelf items
  let order = startingOrder;
  const itemsArr: ShelfItemModelType[] = [];

  items.forEach((item) => {
    itemsArr.push({
      shelf_id: id,
      user_id: user_id,
      taleon_id: itemIdMap.get(item.ext_id) as string,
      ext_id: item.ext_id,
      order,
      year: item.year,
      createdAt: new Date(),
    });

    order = order + 1;
  });

  if (itemsArr.length > 0) {
    await ShelfItem.create(itemsArr, { session, ordered: true });
  }

  return itemsArr;
};

export const getUserFromToken = async (jar: CookiesType): Promise<TokenPayload | null> => {

  const token = jar.get("token")?.value;

  if (!token) return null;

  const payload = await verifyToken(token);

  if (!payload || typeof payload === "string" || !payload.user_id)
    return null;

  else if (payload.exp && (payload.exp * 1000) < Date.now())
    return null

  return payload;
};

export const formDataToObject = (formData: FormData) => {
  const formDataObject: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "files") {
      const prevFiles = formDataObject.files ?? [];
      formDataObject.files =
        value instanceof File
          ? [...prevFiles, value]
          : (formDataObject.files ?? []);
    } else if (value === "undefined") {
      formDataObject[key] = undefined;
    } else {
      formDataObject[key] = JSON.parse(value as string);
    }
  }
  return formDataObject;
};

export const getPageParams = (req: NextRequest, initial: number = 1) => {
  const searchParams = req.nextUrl.searchParams;
  const page = searchParams.get("p") || searchParams.get("page");
  return Number(page || `${initial}`) || initial;
};

type ReturnType<F> = {
  page: number,
  nsfw: boolean,
  filter: string | F,
  query: string | undefined
}

export const getSearchParams = <F extends string | undefined>(url: URL, initial = 1, fallbackFilter?: F): ReturnType<F> => {
  const sp = url.searchParams;
  const query = sp.get('q') || sp.get("query");
  const page = Math.max(Number(sp.get('p') || sp.get("page")) || initial, initial) - 1;
  const nsfw = Boolean(sp.get("nsfw") === "true");
  const filter = sp.get("f") || sp.get("filter") || fallbackFilter;

  return { page, nsfw, filter, query } as ReturnType<F>
}

export const getRevalidateTags = <K extends AvailableRevalidateTags>(
  available: AvailableRevalidateTags,
  options: Partial<RevalidateTagsArgs<K>>
) => {
  const tags = revalidateTags[available];
  if (!tags) return [];

  return tags.map((tag) =>
    Object.keys(options).reduce(
      (t, o) => o ? t.replaceAll(`{${o}}`, options[o as keyof RevalidateTagsArgs<K>] as string) : t,
      tag
    )
  );
};

export const isMilestoneReached = (n: number | undefined | null) => {
  if (!n || n < 10 || !Number.isInteger(n)) return false;
  const num = Number(n.toString().replace(/0/g, ''));
  return [10, 25, 50].includes(num < 10 ? num * 10 : num);
};
