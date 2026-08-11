import placeholder from "@assets/placeholder.png";
import { PaginatedData } from "@type/external";
import {
  AggregatedResponse,
  GeneralGetReturn,
  GeneralMultipleReturn,
  GenericDate,
  InfiniteQueryResponse
} from "@type/internal";
import {
  ArrayForArrayResponse,
  AvailableCacheTags,
  AvailableQueryKeys,
  CacheTagsArgs,
  ErrorCodes,
  ExternalImageType,
  ExtractPlaceholders,
  GetPosterFunctionProps,
  QueryFilterType,
  QueryKeyArgs
} from "@type/other";
import { customAlphabet } from "nanoid";
import {
  cacheTags,
  errorCodes,
  externalImgUrlPrefix,
  lengthForAvgParloId,
  lengthForLongParloId,
  lengthForShortParloId,
  queryFilters,
  queryKeys,
  queryLimit
} from "./constants";

export type ParseResponseType<T = Record<string, any>> = {
  json: T | null,
  text: string,
  ok: boolean,
  status: number,
}

export const parseResponse = async <T>(response: Response): Promise<ParseResponseType<T>> => {
  const body = await response.text();
  try {
    return {
      json: JSON.parse(body || "null"),
      text: body,
      ok: response.ok,
      status: response.status
    }
  } catch (_) {
    return {
      text: body,
      json: null,
      ok: response.ok,
      status: response.status
    }
  }
}

export const handleArrayForArrayResponse = <T, R>(input: T, result: R[]): ArrayForArrayResponse<T, R> => {
  if (Array.isArray(input)) {
    return result as ArrayForArrayResponse<T, R>;
  } else {
    return result[0] as ArrayForArrayResponse<T, R>;
  }
}

export const timeAgo = (timestamp: GenericDate | undefined, short?: boolean) => {
  if (!timestamp) return;
  const time = new Date(timestamp).getTime();

  const elapsed = Date.now() - time;
  const secs = Math.floor(elapsed / 1000);
  const mins = Math.floor(secs / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const mons = Math.ceil(days / 30);
  const yrs = Math.floor(days / 365);

  const units = [
    {
      limit: 60 * 1000,
      message: short ? "now" : "just now"
    },
    {
      limit: 60 * 60 * 1000,
      message: short ? `${mins} m` : `${mins} min${mins > 1 ? "s" : ""} ago`,
    },
    {
      limit: 24 * 60 * 60 * 1000,
      message: short ? `${hrs} h` : `${hrs} hour${hrs > 1 ? "s" : ""} ago`,
    },
    {
      limit: 30 * 24 * 60 * 60 * 1000,
      message: short ? `${days} d` : `${days} day${days > 1 ? "s" : ""} ago`,
    },
    {
      limit: 365 * 24 * 60 * 60 * 1000,
      message: short ? `${mons} mo` : `${mons} month${days / 30 > 1 ? "s" : ""} ago`,
    },
    {
      limit: Infinity,
      message: short ? `${yrs} y` : `${yrs} year${yrs > 1 ? "s" : ""} ago`,
    },
  ];

  return units.find(({ limit }) => elapsed < limit)!.message;
};

export const numberConverter = (num: number | undefined): string => {
  if (!num) return "0";
  if (num < 1000) return num.toString();
  const digits = Math.ceil(Math.log10(num + 1)); //num+1 because Math.log10 returns 2 for 100 and 3 for 101
  const category = ["", "K+", "M+", "B+", "T+", "Q+"];
  const comes = category[Math.ceil(digits / 3) - 1];
  const ignore = digits % 3; // counting the number of 0s to be ignored
  const numToShow = num.toString().slice(0, ignore || 3); // get the remaining number to show after ignoring 0s.
  return numToShow + comes;
};

export const calculateAge = (bday: GenericDate): number => {
  const birthDate = new Date(bday);

  if (isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  // Adjust the age if the user's birthday hasn't occurred this year yet
  const monthDifference = today.getMonth() - birthDate.getMonth();
  const dayDifference = today.getDate() - birthDate.getDate();

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age--;
  }

  return age;
};

export const parseUnknownData = (data: any) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch { }
  }
  return data;
}

export const parseObject = (obj: Record<string, any>): Record<string, any> => {
  if (!obj) return {};
  return Object.keys(obj).reduce((prev, cur) => {
    try {
      return { ...prev, [cur]: JSON.parse(obj[cur]) }
    } catch (_) {
      return { ...prev, [cur]: obj[cur] }
    }
  }, {})
}

export const removeNullishFields = <T extends Record<string, any>>(obj: T): T => {
  if (!obj) return {} as T;
  return Object.keys(obj).reduce((prev, key) => {
    const val = obj[key];
    if (val === null || val === undefined) return prev;
    else return { ...prev, [key]: val }
  }, {}) as T
}

export const makeUrlSafe = (str: string) => {
  if (!str) return '';

  return str
    .slice(0, 100)
    .replace(/[^\w\s]|_/g, '')
    .trim()
    .replace(/\s+/g, "-");
};

export const addProxyForFrames = (url: string) => {
  if (!url) return url;

  const cloudUrl = process.env.NEXT_PUBLIC_QCORE_CLOUD_URI;
  const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL;

  if (!cloudUrl || !proxyUrl)
    throw new Error("Either Cloud URL or Proxy URL is not defined.");

  else if (url.includes(cloudUrl)) return url;

  return `${proxyUrl}/us?url=${encodeURIComponent(url)}`;
}

export const getPoster = <T extends ExternalImageType>(config: GetPosterFunctionProps<T>): string => {
  const { path } = config;

  if (!path) return placeholder.src;

  else if (config.external && !config.extSource) {

    if (!config.size)
      return `${externalImgUrlPrefix}w185${path}`;

    const { size } = config;
    if (!path) return placeholder.src;

    return `${externalImgUrlPrefix}${size}${path}`;
  }

  else if (config.extSource === "web")
    return addProxyForFrames(path);
  
  else return path;
};

export const checkAndReturn = <T>(prop: T, equals?: any, notEquals?: any): T | undefined => {
  if ((notEquals && prop === notEquals) || (equals && prop !== equals) || !Boolean(prop)) return undefined;
  else return prop;
}

const nanoid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_",
  lengthForAvgParloId,
);

export const parloId = (length = lengthForAvgParloId) => {
  return nanoid(length);
}

// Validate id from URL before hitting the database.
// Suppose 1234 is passed as an id which obviously wont bring any result.
// So validating it beforehand would be time and effort saving.

export const isValidParloId = (id: string): boolean => {
  // Short to Avg ParloId can be of length 10 to 16, long ParloId are of length 21.
  if (id.length < lengthForShortParloId || (id.length > lengthForAvgParloId && id.length !== lengthForLongParloId))
    return false;
  else return /^[a-zA-Z0-9_]{0,}$/.test(id);
};


export const codetoError = (errCode: ErrorCodes): string => {
  return (
    errorCodes[errCode]?.message ?? "Something went wrong! Please try again."
  );
};

export const infiniteScrollerResponse = (
  response:
    | {
      data: any[];
      total: number;
    }
    | InfiniteQueryResponse,
  page: number
): InfiniteQueryResponse => {
  if ("total_results" in response) return response;
  const { data, total } = response;
  const results = Array.isArray(data) ? data : [];
  const totalRes = total && !isNaN(total) ? total : 0;

  return {
    results,
    page,
    total_pages: Math.ceil(totalRes / queryLimit),
    total_results: totalRes,
  };
};

export const refineSearchParams = (
  queryFilter: QueryFilterType,
  p?: string,
  f?: string
) => {
  const page: number = parseInt(p || "1") || 1;
  const filter: string =
    f && queryFilters[queryFilter].includes(f || "")
      ? f
      : queryFilters[queryFilter]?.[0];
  return { page, filter };
};

export const getCacheTags = <K extends AvailableCacheTags>(
  available: AvailableCacheTags,
  options: CacheTagsArgs<K>
) => {
  const tags = cacheTags[available];
  if (!tags) return [];

  return tags.map((tag) =>
    Object.keys(options).reduce(
      (t, o) => t.replaceAll(`{${o}}`, `${options[o as ExtractPlaceholders<K>]}`),
      tag
    )
  );
};

export const getQueryKeys = <K extends AvailableQueryKeys>(
  available: K,
  options: QueryKeyArgs<K>
): string[] => {
  const keys = queryKeys[available];
  if (!keys) return [];

  return keys.map((key) =>
    Object.keys(options).reduce(
      (t, o) => t.replaceAll(`{${o}}`, options[o as keyof QueryKeyArgs<K>]),
      key
    )
  );
};

export const trycatch = <T>(
  func: () => Promise<T> | T,
  msg?: string
): Promise<T> | T => {
  try {
    return func();
  } catch (err: any) {
    console.error(msg || "Error occured:", err.message);
    return { success: false, errCode: "unstable_internet" } as T;
  }
};

export const refineResponseForQuery = async<T>(queryFn: () => Promise<GeneralGetReturn<T>>): Promise<T | null> => {
  const { success, errCode, result } = await queryFn();

  if (!success) throw new Error(errCode);

  return result ?? null;
}

export const refineResponseForInfiniteQuery = async<T>(
  queryFn: () => Promise<GeneralMultipleReturn<T> | GeneralGetReturn<PaginatedData>>,
  page: number
): Promise<InfiniteQueryResponse<T>> => {
  const { success, errCode, result } = await queryFn();

  if (!success) throw new Error(errCode);

  return infiniteScrollerResponse((result as AggregatedResponse<T>), page);

}

export const generateInitialData = (data: unknown[]) => ({
  data,
  total: data.length === queryLimit ? queryLimit + 1 : data.length,
});

export const getTimeInFuture = ({
  timeVal = 1,
  unit,
  from,
}: {
  unit: "m" | "h" | "d" | "mo" | "y";
  timeVal?: number;
  from?: GenericDate;
}) => {
  const provided = from && new Date(from).getTime();
  const now = provided && !isNaN(provided) ? provided : Date.now();
  switch (unit) {
    case "m":
      return now + 1000 * 60 * timeVal;
    case "h":
      return now + 1000 * 3600 * timeVal;
    case "d":
      return now + 1000 * 3600 * 24 * timeVal;
    case "mo":
      return now + 1000 * 3600 * 24 * 30 * timeVal;
    case "y":
      return now + 1000 * 3600 * 24 * 365 * timeVal;
  }
};

class ConditionalArray<T> extends Array<T> {
  /**
   * @param prop The condition to be checked to concat the item in the array.
   * @param getItem The function to get the item(s) to be concatenated in the array only if the condition resolves to true. The Non-Nullable `prop` parameter is passed as an argument.
   * @returns The modified array with the item(s) concatenated if condition resolves to true else the same array.
   *
   * Checks the condition, if the condition resolves to true, it `pushes` the item(s) returned from `getItem` function in the array and returns the modified array otherwise returns the same array.
   */
  concatConditionally<P extends unknown>(
    prop: P,
    getItem?: (p: NonNullable<P>) => T | T[]
  ): this {
    if (prop) {
      const item: T | T[] = getItem ? getItem(prop as NonNullable<P>) : prop as T;
      const items = Array.isArray(item) ? item : [item];
      this.push(...items);
    }
    return this;
  }
}

export const createArray = <T>(initial: T | T[]): ConditionalArray<T> => {
  const array = Array.isArray(initial) ? initial : [initial];
  return new ConditionalArray<T>(...array);
};

export const capitalize = (str: string) => {
  if (!str || !str.at(0)) return "";
  return (str.at(0) ?? "").toUpperCase().concat(str.slice(1, str.length));
};

export const isEqual = <T, U extends readonly unknown[]>(
  propToCheck: T,
  ...conditions: U
): propToCheck is Extract<T, U[number]> => conditions.includes(propToCheck);