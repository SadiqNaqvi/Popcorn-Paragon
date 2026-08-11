import { parseUnknownData } from "@lib/shared/utils";
import { ScoreMember, Redis as UpstashRedis, ZAddCommandOptions } from "@upstash/redis";
import Redis, { ChainableCommander } from "ioredis";
import { getRedis, getUpstashRedis } from "../providers/redis";

export type Pipeline = ReturnType<UpstashRedis["pipeline"]>;

export const isUpstashPipeline = (instance: Redis | Pipeline | ChainableCommander): instance is Pipeline => {

  return !(instance instanceof Redis || "zrevrange" in instance)
}

export const zaddInUpstash = async (key: string, items: ScoreMember<any>[], pipeline?: Pipeline, opts?: ZAddCommandOptions) => {
  const transaction = pipeline ?? (await getUpstashRedis()).multi();

  const [first, ...rest] = items;
  if (opts)
    return transaction.zadd(key, opts, first, ...rest);

  return transaction.zadd(key, first, ...rest);
}

export const handleUpstashPipelineResponse = <T = unknown>(res: T | (T | T[])[] | null): T[] => {

  if (!res) {
    console.log("Pipline returned nothing");
    throw new Error("Pipeline returned nothing");
  }

  else if (!Array.isArray(res)) return [res] as T[]

  return res.map(result => {

    if (!Array.isArray(result)) return result;

    return result.map(r => {
      if (!r) return r;
      else if (Array.isArray(r)) {
        return r.map(parseUnknownData) as T;
      }
      return parseUnknownData(r) as T;
    })
  }) as T[];
}

export const handlePipelineResponse = <T = unknown>(res: T | [err: Error | null, res: unknown][] | null): T[] => {

  if (!res) {
    console.log("Pipline returned nothing");
    throw new Error("Pipeline returned nothing");
  }

  else if (!Array.isArray(res)) return [res] as T[]

  return res.map(result => {

    if (!Array.isArray(result)) return result;

    const [e, r] = result;

    if (e) throw new Error(e.message);
    else if (Array.isArray(r)) {
      return r.map(parseUnknownData) as T;
    }
    return parseUnknownData(r) as T;
  });
}


type RedisJsonCommands =
  | "set"
  | "get"
  | "del"
  | "type"
  | "strLen"
  | "strAppend"
  | "numIncrBy"
  | "numMultBy"
  | "arrAppend"
  | "arrInsert"
  | "arrTrim"
  | "arrPop"
  | "objLen"
  | "objKeys"
  | "objUpdateMulti"
  | "toggle"

type BaseOptions = [path: RedisJsonPath, key: string]

interface RedisJsonOptionsMap extends Record<RedisJsonCommands, [...BaseOptions, ...any] | any[]> {
  get: [...BaseOptions, index?: number]
  set: [...BaseOptions, value: any]
  del: [...BaseOptions, index?: number],
  type: BaseOptions,
  strLen: BaseOptions,
  strAppend: [...BaseOptions, value: string]
  numIncrBy: [...BaseOptions, value: number]
  numMultBy: [...BaseOptions, value: number]
  arrAppend: [...BaseOptions, value: any]
  arrInsert: [...BaseOptions, value: NonNullable<any>, start: number, end: number]
  arrTrim: [...BaseOptions, start: number, end: number]
  arrPop: [...BaseOptions, index?: number]
  objLen: BaseOptions,
  objKeys: BaseOptions,
  objUpdateMulti: [key: string, obj: Record<string, any>]
  toggle: [...BaseOptions, index?: number]
}

type RedisJsonPath = "root" | string

const resolvePath = (path: RedisJsonPath, index?: number) => {
  return `$${index ? `[${index}]` : ''}${path === "root" ? '' : `.${path}`}`
}

export const RedisJson = <E extends Redis | ChainableCommander | Pipeline, T extends RedisJsonCommands = RedisJsonCommands>(redis: E): Record<T, (...options: RedisJsonOptionsMap[T]) => unknown> => {
  if (!redis) throw new Error("You need to pass redis instance to use Redis JSON.")
  else if (isUpstashPipeline(redis)) throw new Error("Upstash redis is passed for Redis JSON");
  return {

    /**
     * Pass index only if the value is type of array and you want to read a single element of the array at the given index.
     * 
     * Reverse indexing is supported
     * 
     * @example
     * -1 for the last element and so on.
     */

    get: <T,>(path: RedisJsonPath, key: string, index?: number) =>
      redis.call("JSON.GET", key, resolvePath(path, index)),

    set: (path: RedisJsonPath, key: string, value: any) =>
      redis.call("JSON.SET", key, resolvePath(path), JSON.stringify(value)),

    /**
     * Pass index only if the type is array and you want to delete a single element of the array at the given index.
     * 
     * Reverse indexing is supported
     * 
     * @example
     * -1 for the last element and so on.
     */

    del: (path: RedisJsonPath, key: string, index?: number) =>
      redis.call("JSON.DEL", key, resolvePath(path, index)),

    type: (path: RedisJsonPath, key: string) =>
      redis.call("JSON.DEL", key, resolvePath(path)),

    strLen: (path: RedisJsonPath, key: string) =>
      redis.call("JSON.STRLEN", key, resolvePath(path)),

    strAppend: (path: RedisJsonPath, key: string, value: string) =>
      redis.call("JSON.STRAPPEND", key, resolvePath(path), value),

    numIncrBy: (path: RedisJsonPath, key: string, value: number) =>
      redis.call("JSON.NUMINCRBY", key, resolvePath(path), value),

    numMultBy: (path: RedisJsonPath, key: string, value: number) =>
      redis.call("JSON.NUMMULTBY", key, resolvePath(path), value),

    arrAppend: (path: RedisJsonPath, key: string, value: any) =>
      redis.call("JSON.ARRAPPEND", key, resolvePath(path), value),

    arrInsert: (path: RedisJsonPath, key: string, value: any, start: number, end: number) =>
      redis.call("JSON.ARRINSERT", key, resolvePath(path), value, start, end),

    arrTrim: (path: RedisJsonPath, key: string, start: number, end: number) =>
      redis.call("JSON.ARRTRIM", key, resolvePath(path), start, end),

    arrPop: (path: RedisJsonPath, key: string, index?: number) =>
      redis.call("JSON.ARRPOP", key, resolvePath(path, index)),

    objLen: (path: RedisJsonPath, key: string) =>
      redis.call("JSON.OBJLEN", key, resolvePath(path)),

    objKeys: (path: RedisJsonPath, key: string) =>
      redis.call("JSON.OBJKEYS", key, resolvePath(path)),

    /*
    * Recommended to use redis multi for this since it will make N requests to redis. N is the number of keys to update
    */

    objUpdateMulti: (key: string, obj: Record<string, any>) =>
      Object.entries(obj).forEach(([k, v]) => {
        redis.call("JSON.SET", key, resolvePath(k), JSON.stringify(v));
      }),

    /**
     * Only works for boolean field.
     */

    toggle: (path: RedisJsonPath, key: string, index?: number) =>
      redis.call("JSON.TOGGLE", key, resolvePath(path, index)),
  } as Record<T, (...options: RedisJsonOptionsMap[T]) => unknown>;
}

export type RedisInstance = Redis;

export type AllowedRedisMethods =
  | "get"
  | "zrange"
  | "zrevrange"
  | "zrangebyscore"
  | "zrevrangebyscore"
  | "lrange"
  | "hgetall"
  | "hget"
  | "hmget"
  | "smembers"
  | "exists"

export type RedisMethodProps = {
  get: [],
  zrange: [min: number, max: number],
  zrevrange: [start: number, stop: number],
  zrangebyscore: [min: number, max: number],
  zrevrangebyscore: [start: number, stop: number,],
  lrange: [start: number, stop: number],
  hgetall: [],
  hget: [field: string],
  hmget: [...fields: string[]],
  smembers: [],
  exists: [],
}

export type TypedStore = Map<string, unknown>

export interface BaseStage {
  readonly method: string;
}

export interface RedisStage<M extends AllowedRedisMethods = AllowedRedisMethods> extends BaseStage {
  method: M;
  key: string;
  ref?: string;
  // options?: Tail<Parameters<RedisInstance[M]>>;
  options?: RedisMethodProps[M];
}

export interface RedisJsonStage<C extends RedisJsonCommands = RedisJsonCommands> extends BaseStage {
  method: `json.${C}`,
  key: string;
  ref?: string;
  options: RedisJsonOptionsMap[C],
}

export type ExtendedRedisStage = RedisStage | RedisJsonStage;

export interface ExecuteStage extends BaseStage {
  method: 'execute';
}

export interface ConditionStage extends BaseStage {
  method: 'condition';
  ref?: string;
  validate: (store: TypedStore, val?: any) => boolean | Promise<boolean>;
}

export interface LookupStage extends BaseStage {
  method: 'lookup';
  ref?: string;
  explore: (store: TypedStore, val?: any) => ExtendedRedisStage[] | Promise<ExtendedRedisStage[]>;
}

export interface AddFieldStage extends BaseStage {
  method: 'addField';
  field: string;
  val: (store: TypedStore) => unknown | Promise<unknown>;
}

export type TransformReturnType = { key: string, value: unknown }
export interface TransformStage extends BaseStage {
  method: 'transform';
  ref?: string;
  transform: (store: TypedStore, val?: any) => TransformReturnType[] | Promise<TransformReturnType[]>;
};

export interface ReturnStage<T = unknown> extends BaseStage {
  method: 'return';
  value: (store: TypedStore) => T | Promise<T>;
}

export type Stage<T = unknown> =
  | RedisStage
  | RedisJsonStage
  | ExecuteStage
  | ConditionStage
  | LookupStage
  | AddFieldStage
  | TransformStage
  | ReturnStage<T>;

const isRedisStage = (s: Stage): s is RedisStage => {
  const redisMethods = new Set([
    "get",
    "zrange",
    "zrevrange",
    "zrangebyscore",
    "zrevrangebyscore",
    "lrange",
    "hgetall",
    "hget",
    "hmget",
    "smembers",
    "exists",
  ]);
  return redisMethods.has(s.method);
}

const isRedisJsonStage = (s: Stage): s is RedisJsonStage => {
  return s.method.startsWith('json.');
}

const mapResults = (stack: ExtendedRedisStage[], results: unknown[], store: TypedStore) => {
  if (stack.length !== results.length)
    throw new Error("Size of the results does not match the size of the stack for execution.");

  stack.forEach((stage, i) => {
    const result = results[i];
    store.set(stage.ref || stage.key, result);
  });
}

const execUpstashStage = <M extends AllowedRedisMethods>(
  multi: Pipeline,
  stage: RedisStage<M>,
) => {
  const options = (stage.options ?? []);
  const { method, key } = stage;

  switch (method) {
    case "exists": return multi.exists(key);
    case "get": return multi.get(key);
    case "hgetall": return multi.hgetall(key);
    case "smembers": return multi.smembers(key);

    case "hget": return multi.hget(key, ...options as RedisMethodProps["hget"]);
    case "hmget": return multi.hmget(key, ...options as RedisMethodProps["hmget"]);
    case "lrange": return multi.lrange(key, ...options as RedisMethodProps["lrange"]);
    case "zrange": return multi.zrange(key, ...options as RedisMethodProps["zrange"]);
    case "zrangebyscore": return multi.zrange(key, ...options as RedisMethodProps["zrangebyscore"]);
    case "zrevrange": return multi.zrange(key, ...options as RedisMethodProps["zrevrange"]);
    case "zrevrangebyscore": return multi.zrange(key, ...options as RedisMethodProps["zrevrangebyscore"]);
  }
}

function execStage<M extends AllowedRedisMethods>(
  multi: ChainableCommander | Pipeline,
  stage: RedisStage<M>,
) {
  const options = (stage.options ?? []);
  if (isUpstashPipeline(multi))
    return execUpstashStage(multi, stage);

  return (multi[stage.method] as any)(stage.key, ...options);
}

const executeStack = async (redis: Redis | UpstashRedis, stack: ExtendedRedisStage[], isUpstash: boolean) => {
  const multi = redis.multi();
  const ins = isUpstash ? null : RedisJson(multi);

  stack.forEach(stage => {
    const redisJsonStage = isRedisJsonStage(stage);
    if (redisJsonStage && ins === null)
      throw new Error("Redis json is not available in Upstash Redis");
    else if (redisJsonStage) {
      if (!ins) return;
      const command = stage.method.replace('json.', '') as RedisJsonCommands;
      // const method = ins[command];
      // method(...stage.options)
      (ins[command] as Function).call(ins, ...stage.options)
    }
    else execStage(multi, stage);
  });

  const resp = await multi.exec().then(handleUpstashPipelineResponse);
  return resp;
}

export const redisAggregator = async <T,>(stages: Stage<T>[], upstash?: UpstashRedis): Promise<T | null> => {

  const redis = upstash ?? await getRedis();

  if (!stages.length || stages[0].method === "execute" || stages[0].method === "return" || stages.at(-1)?.method !== "return") return null;

  const store: TypedStore = new Map();
  let stageStack: ExtendedRedisStage[] = [];
  let returnVal: T | null = null
  try {
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];

      if (isRedisStage(stage) || isRedisJsonStage(stage)) {
        stageStack.push(stage);
      }

      else if (stage.method === "condition") {
        const condition = await stage.validate(store, store.get(stage.ref || ""))
        if (!condition) throw new Error(`Condition failed. The condition at stage ${i} failed.`)
      }

      else if (stage.method === "addField") {
        store.set(stage.field, await stage.val(store));
      }

      else if (stage.method === "lookup") {
        const lookedupStages = await stage.explore(store, store.get(stage.ref ?? ""));
        lookedupStages.forEach(stage => {
          stageStack.push(stage);
        });
      }

      else if (stage.method === "transform") {
        const transforms = await stage.transform(store, store.get(stage.ref ?? ""));
        transforms.forEach(transformed => {
          store.set(transformed.key, transformed.value);
        });
      }

      else if (stage.method === "execute") {

        if (!stageStack.length) throw new Error("Unexpected execute stage. There must be at least one stage before an execute stage or between two execute stages.")

        const results = await executeStack(redis, stageStack, !!upstash);

        mapResults(stageStack, results, store);
        stageStack = [];
      }

      else if (stage.method === "return") {
        returnVal = await stage.value(store);
      }
    }

    store.clear();
    return returnVal;
  } catch (err: any) {
    console.error("Error occured in Redis Aggregator", err.message);
    return null;
  }
}