import { getSearchParams } from "@lib/backend/utils";
import { queryLimit } from "@lib/shared/constants";
import { capitalize, createArray } from "@lib/shared/utils";
import { Comment, Connection, Member, Post, Shelf, Thread, User } from "@model";
import { GeneralGetReturn } from "@type/internal";
import { CommentModelType, PostModelType } from "@type/models";
import { PipelineFunc, PipelineStage, QueryFilter } from "@type/mongoose";
import { NextRequest } from "next/server";

type SearchableCollections = "users" | "posts" | "threads" | "shelves";
type Collections = "comments" | SearchableCollections;

export const userProjection = {
  username: 1,
  profile: 1,
  name: 1,
  followers: 1,
  posts: 1,
}

export const postProjection = {
  user: 0,
  thread: 0,
  user_id: 0,
  body: 0,
  links: 0,
}

export const threadProjection = {
  name: 1,
  nsfw: 1,
  member_count: 1,
  post_count: 1,
  poster: 1,
  createdAt: 1,
}

export const commentProjection = {
  user: 0,
  reply: 0,
  edited_at: 0,
}

export const shelfProjection = {
  user_id: 0,
  updatedAt: 0,
}

export const attachNsfwInPipeline = (obj: Object, nsfw: boolean) => {
  if (nsfw) return obj;
  return { ...obj, nsfw }
}

export const createPipeline = ({
  filters,
  page,
  projection,
  sort,
  preProjection,
  limit = queryLimit
}: {
  filters: PipelineStage[];
  page: number;
  sort?: Record<string, number | string>;
  preProjection?: PipelineStage[];
  projection: Record<string, any>;
  limit?: number;
}): PipelineStage[] => [
    ...filters,
    {
      $facet: {
        total: [{ $count: "count" }],
        data: [
          ...(sort ? [{ $sort: sort }] : []),
          { $skip: page * limit },
          { $limit: limit },
          ...(preProjection ?? []),
          { $project: projection },
        ] as PipelineStage.FacetPipelineStage[],
      },
    },
    {
      $project: {
        _id: 0,
        total: { $arrayElemAt: ["$total.count", 0] },
        data: 1,
      },
    },
  ];

const projectionMap: Record<Collections, { [field: string]: number }> = {
  comments: commentProjection,
  posts: postProjection,
  shelves: shelfProjection,
  threads: threadProjection,
  users: userProjection
}

const operatorMap: Record<string, string> = {
  $eq: "$eq",
  $ne: "$ne",
  $gt: "$gt",
  $lt: "$lt",
  $gte: "$gte",
  $lte: "$lte",
  $in: "$in",
  $nin: "$nin",
};

export const convertMatchToLookupExpr = <T = any>(matchObj: QueryFilter<T>): PipelineStage.Match => {

  const convertCondition = (key: string, value: any) => {
    // Primitive -> $eq
    if (operatorMap[key]) {
      return { [key]: value }
    }

    else if (typeof value !== "object" || value === null) {
      return { $eq: [`$${key}`, value] };
    }

    // Operators
    const expressions = [];

    for (const op in value) {
      const val = value[op];


      if (!operatorMap[op]) {
        throw new Error(`Unsupported operator: ${op}`);
      }

      expressions.push({
        [operatorMap[op]]: [`$${key}`, val],
      });
    }

    // If only one operator → return directly
    return expressions.length === 1 ? expressions[0] : { $and: expressions };
  }

  const parse = (match: QueryFilter<T>): any => {
    const exprConditions = [];

    for (const key in match) {
      const value = match[key] as QueryFilter<T>[];

      // Handle logical operators at root
      if (key === "$and" || key === "$or") {
        exprConditions.push({
          [key]: value.map((item) => {
            const parsed = parse(item);
            return parsed.$expr || parsed;
          }),
        });
      } else {
        exprConditions.push(convertCondition(key, value));
      }
    }

    return {
      $expr: exprConditions.length === 1
        ? exprConditions[0]
        : { $and: exprConditions }
    };
  }

  return { $match: parse(matchObj) };
}

const lookupOrAndChangeRoot = (collection: Collections, forLookup: string | undefined): PipelineStage[] => {
  if (!forLookup) return [];

  const project = projectionMap[collection];
  if (!project) throw new Error("invalid collection passed in lookupOrAndChangeRoot function");

  // This is to optimise performance, why lookup for all the documents when we need to skip & limit documents later. So first skip & limit then lookup and replace root.

  return createArray<PipelineStage>([])
    .concatConditionally(forLookup, (localField) => ({
      $lookup: {
        from: collection,
        localField,
        foreignField: "_id",
        pipeline: [{ $project: project }],
        as: collection,
      }
    })
    ).concatConditionally(forLookup, () => [
      {
        $set: {
          doc: { $first: `$${collection}` }
        }
      },
      {
        $replaceWith: "$doc"
      }
    ]);

}

export const postsAggregationPipeline: PipelineFunc<{ isLinkBased: boolean; excludeQuotedPost: boolean }> = (
  { filters, sort, page = 1, isLinkBased, localFieldForLookup, excludeQuotedPost }
) =>
  createPipeline({
    filters,
    sort,
    page,
    preProjection: [
      ...lookupOrAndChangeRoot("posts", localFieldForLookup),
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          pipeline: [{ $project: { username: 1, profile: 1 } }],
          as: "user",
        },
      },
      {
        $lookup: {
          from: "threads",
          localField: "thread_id",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, poster: 1 } }],
          as: "thread",
        },
      },
      ...(excludeQuotedPost ? [] : [
        {
          $lookup: {
            from: "posts",
            localField: "quoted_post_id",
            foreignField: "_id",
            pipeline: [{ $project: { title: 1, frames_count: 1, links_count: 1 } }],
            as: "quoted_post",
          },
        }
      ]),
      {
        $addFields: {
          thread_name: { $arrayElemAt: ["$thread.name", 0] },
          username: { $arrayElemAt: ["$user.username", 0] },
          profile: { $arrayElemAt: ["$user.profile", 0] },
          poster: { $arrayElemAt: ["$thread.poster", 0] },
          quoted_post_title: { $ifNull: [{ $arrayElemAt: ["$quoted_post.title", 0] }, ""] },
          quoted_post_frames_count: { $ifNull: [{ $arrayElemAt: ["$quoted_post.frames_count", 0] }, 0] },
          quoted_post_links_count: { $ifNull: [{ $arrayElemAt: ["$quoted_post.links_count", 0] }, 0] }
        },
      },
    ],
    projection: {
      user: 0,
      thread: 0,
      user_id: 0,
      body: 0,
      [isLinkBased ? "frames" : "links"]: 0,
    },
  });

export const commentsAggregationPipelineWithReplies: PipelineFunc = (
  { filters, page, sort, localFieldForLookup }
) =>
  createPipeline({
    filters,
    page,
    sort,
    preProjection: [
      ...lookupOrAndChangeRoot("comments", localFieldForLookup),
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          pipeline: [{ $project: { username: 1, profile: 1 } }],
          as: "user",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "replied_to",
          foreignField: "_id",
          pipeline: [{ $project: { content: 1, attachment: 1 } }],
          as: "reply",
        },
      },
      {
        $addFields: {
          username: {
            $ifNull: [{ $arrayElemAt: ["$user.username", 0] }, ""],
          },
          profile: {
            $ifNull: [{ $arrayElemAt: ["$user.profile", 0] }, ""],
          },
          parentComment: {
            content: {
              $substr: [
                { $ifNull: [{ $arrayElemAt: ["$reply.content", 0] }, ""] },
                0,
                50,
              ],
            },
            attachment: {
              $ifNull: [{ $arrayElemAt: ["$reply.attachment", 0] }, ""]
            },
          },
        },
      },
    ],
    projection: commentProjection,
  });

export const commentsAggregationPipeline: PipelineFunc = (
  { filters, page, sort, localFieldForLookup }
) =>
  createPipeline({
    filters,
    sort,
    page,
    preProjection: [
      ...lookupOrAndChangeRoot("comments", localFieldForLookup),
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          pipeline: [{ $project: { username: 1, profile: 1 } }],
          as: "user",
        },
      },
      {
        $addFields: {
          username: {
            $ifNull: [{ $arrayElemAt: ["$user.username", 0] }, ""],
          },
          profile: {
            $ifNull: [{ $arrayElemAt: ["$user.profile", 0] }, ""],
          },
        },
      },
    ],
    projection: commentProjection,
  });

export const threadsAggregationPipeline: PipelineFunc = (
  { filters, page, sort, localFieldForLookup }
) =>
  createPipeline({
    filters,
    sort,
    page,
    preProjection: lookupOrAndChangeRoot("threads", localFieldForLookup),
    projection: threadProjection,
  });

export const shelvesAggregationPipeline: PipelineFunc = (
  { filters, page, sort, localFieldForLookup }
) =>
  createPipeline({
    filters,
    sort,
    page,
    preProjection: lookupOrAndChangeRoot("shelves", localFieldForLookup),
    projection: shelfProjection,
  });

export const itemsAggregationPipeline: PipelineFunc<{ shelf_creator: string }> = ({ filters, page, sort, shelf_creator }) =>
  createPipeline({
    filters,
    sort,
    page,
    preProjection: [
      {
        $lookup: {
          from: "taleons",
          localField: "taleon_id",
          foreignField: "_id",
          pipeline: [{ $project: { title: 1, taleon_type: 1, poster: 1 } }],
          as: "taleon",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          pipeline: [{ $project: { username: 1 } }],
          as: "user"
        }
      },
      {
        $addFields: {
          title: { $arrayElemAt: ["$taleon.title", 0] },
          taleon_type: { $arrayElemAt: ["$taleon.taleon_type", 0] },
          poster: { $arrayElemAt: ["$taleon.poster", 0] },
          added_by: {
            $cond: {
              if: { $eq: ["$user_id", shelf_creator] },
              then: undefined,
              else: { $arrayElemAt: ["$user.username", 0] },
            },
          },
        },
      },
    ],
    projection: { taleon: 0, user: 0 },
  });

export const usersAggregationPipeline: PipelineFunc = (
  { filters, page, sort, localFieldForLookup, limit }
) =>
  createPipeline({
    filters,
    sort,
    page,
    preProjection: lookupOrAndChangeRoot("users", localFieldForLookup),
    projection: userProjection,
    limit,
  });

export const bookmarkAggregationPipeline: PipelineFunc<{
  type: "post" | "shelf" | "comment";
}> = ({ filters, page, type }) => {
  const sort = { createdAt: -1 };
  if (type === "comment")
    return commentsAggregationPipeline({ filters, page, sort, localFieldForLookup: "content_id" });
  else if (type === "shelf")
    return shelvesAggregationPipeline({ filters, page, sort, localFieldForLookup: "content_id" });
  else if (type === "post")
    return postsAggregationPipeline({ filters, page, sort, localFieldForLookup: "content_id", excludeQuotedPost: true, isLinkBased: false });
  else return [];
};

export const currentUserPipeline = (filter: PipelineStage.Match["$match"]) => [
  { $match: filter },

  {
    $lookup: {
      from: "shelves",
      let: { id: "$_id" },
      pipeline: [
        convertMatchToLookupExpr({ user_id: "$$id", shelf_type: { $ne: "custom" } }),
        { $project: shelfProjection }
      ],
      as: "predefinedShelves",
    },
  },

  {
    $project: {
      isActive: 0,
      lastLoginAt: 0,
      session_id: 0,
      passkey: 0,
    },
  },
];

export const getFollowersToNotify = async (user_id: string, limit = 50): Promise<{ follower: string }[]> => {
  return await Connection.aggregate([
    {
      $match: { followee: user_id, notification: true },
    },
    {
      $lookup: {
        from: "users",
        localField: "follower",
        foreignField: "_id",
        pipeline: [
          convertMatchToLookupExpr({ isActive: true }),
          { $project: { updatedAt: 1 } }
        ],
        as: "user",
      },
    },
    { $sort: { "user.updatedAt": -1 } },
    { $limit: limit },
    { $project: { follower: 1 } },
  ]);
};

export const getMembersToNotify = async (
  tid: string,
  limit = 50,
  except?: string,
): Promise<{ user_id: string }[]> => {
  return await Member.aggregate([
    {
      $match: {
        thread_id: tid,
        notification: true,
        ...(except && { user_id: { $ne: except } })
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "follower",
        foreignField: "_id",
        pipeline: [
          convertMatchToLookupExpr({ isActive: true }),
          { $project: { updatedAt: 1 } }
        ],
        as: "user",
      },
    },
    { $sort: { "user.updatedAt": -1 } },
    { $limit: limit },
    { $project: { user_id: 1 } },
  ]);
};

const performAggregation = ({ filters, page, sort, type }: { filters: PipelineStage[], page: number, sort?: any, type: Collections }) => {
  if (type === "posts") return Post.aggregate(postsAggregationPipeline({ filters, page, sort, excludeQuotedPost: true, isLinkBased: false }));
  else if (type === "comments") return Comment.aggregate(commentsAggregationPipeline({ filters, page, sort }));
  else if (type === "shelves") return Shelf.aggregate(shelvesAggregationPipeline({ filters, page, sort }));
  else if (type === "threads") return Thread.aggregate(threadsAggregationPipeline({ filters, page, sort }));
  else return User.aggregate(usersAggregationPipeline({ filters, page, sort }));
}

type FilterInsideSearchType = Record<string, boolean | number | string>;

type SearchHandlerProps = {
  filters: PipelineStage[],
  type: SearchableCollections,
  r: NextRequest,
  applyNsfwCheck?: boolean,
  filterInsideSearch?: FilterInsideSearchType
}

const getSearchPipelineForThreads = (query: string, allowNsfw: boolean): PipelineStage[] => [
  {
    $search: {
      index: "thread",
      compound: {
        must: allowNsfw
          ? []
          : [
            {
              equals: {
                path: "nsfw",
                value: false
              }
            }
          ],
        should: [
          {
            autocomplete: {
              query,
              path: "name",
              score: { boost: { value: 5 } }
            }
          },
          {
            text: {
              query,
              path: "name",
              fuzzy: { maxEdits: 1 },
              score: { boost: { value: 4 } }
            }
          },
          {
            text: {
              query,
              path: "description",
              fuzzy: { maxEdits: 1 },
              score: { boost: { value: 2 } }
            }
          }
        ]
      }
    }
  },
  {
    $addFields: {
      recencyScore: {
        $divide: [
          1,
          {
            $add: [
              1,
              {
                $divide: [
                  { $subtract: [new Date(), "$lastPostedAt"] },
                  1000 * 60 * 60 * 24
                ]
              }
            ]
          }
        ]
      }
    }
  },
  {
    $addFields: {
      finalScore: {
        $add: [
          { $meta: "searchScore" },
          { $multiply: ["$member_count", 0.02] },
          { $multiply: ["$post_count", 0.01] },
          { $multiply: ["$recencyScore", 2] }
        ]
      }
    }
  },
]

const getSearchPipelineForPosts = (query: string, allowNsfw = false): PipelineStage[] => [
  {
    $search: {
      index: "post",
      compound: {
        must: [
          ...(allowNsfw ? [] : [
            { equals: { path: "nsfw", value: false } }
          ]),
        ],
        should: [
          {
            autocomplete: {
              query,
              path: "title",
              score: { boost: { value: 6 } }
            }
          },
          {
            text: {
              query,
              path: "title",
              fuzzy: { maxEdits: 1 },
              score: { boost: { value: 4 } }
            },
          },
          {
            text: {
              query,
              path: "body",
              score: { boost: { value: 2 } }
            }
          }
        ]
      }
    }
  },
  {
    $addFields: {
      engagementScore: {
        $add: [
          { $multiply: ["$reaction_count", 0.02] },
          { $multiply: ["$comment_count", 0.03] },
          { $multiply: ["$saved_count", 0.05] },
        ]
      }
    }
  },
  {
    $addFields: {
      recencyScore: {
        $divide: [
          1,
          {
            $add: [
              1,
              {
                $divide: [
                  { $subtract: [new Date(), "$createdAt"] },
                  1000 * 60 * 60 * 24
                ]
              }
            ]
          }
        ]
      }
    }
  },
  {
    $addFields: {
      finalScore: {
        $add: [
          { $meta: "searchScore" },
          "$engagementScore",
          { $multiply: ["$recencyScore", 3] }
        ]
      }
    }
  },
]

export const getSearchPipelineForUsers = (query: string): PipelineStage[] => [
  {
    $search: {
      index: "user",
      compound: {
        must: [
          { equals: { path: "isActive", value: true } }
        ],
        should: [
          {
            autocomplete: {
              query,
              path: "username",
              score: { boost: { value: 8 } }
            }
          },
          {
            text: {
              query,
              path: "username",
              fuzzy: { maxEdits: 1 },
              score: { boost: { value: 6 } }
            }
          },
          {
            autocomplete: {
              query,
              path: "name",
              score: { boost: { value: 4 } }
            }
          },
        ]
      }
    }
  },
  {
    $addFields: {
      activityScore: {
        $divide: [
          1,
          {
            $add: [
              1,
              {
                $divide: [
                  { $subtract: [new Date(), "$lastLoginAt"] },
                  1000 * 60 * 60 * 24
                ]
              }
            ]
          }
        ]
      }
    }
  },
  {
    $addFields: {
      finalScore: {
        $add: [
          { $meta: "searchScore" },
          { $multiply: ["$followers", 0.02] },
          { $multiply: ["$posts", 0.01] },
          { $multiply: ["$activityScore", 3] }
        ]
      }
    }
  },
]

const getSearchPipelineForShelves = (query: string): PipelineStage[] => {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const regex = tokens.map(token => ({ name: { $regex: token, $options: 'i' } }));

  return [
    { $match: { $or: regex, shelf_type: "custom", isPrivate: false } },
    {
      $addFields: {
        exactMatchScore: {
          $cond: [
            { $eq: [{ $toLower: "$name" }, query.toLowerCase()] },
            5,
            0
          ]
        }
      }
    },
    {
      $addFields: {
        popularityScore: {
          $add: [
            { $multiply: ["$saved_count", 0.05] },
            { $multiply: ["$item_count", 0.02] }
          ]
        }
      }
    },
    {
      $addFields: {
        recencyScore: {
          $divide: [
            1,
            {
              $add: [
                1,
                {
                  $divide: [
                    { $subtract: [new Date(), "$createdAt"] },
                    1000 * 60 * 60 * 24
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    {
      $addFields: {
        finalScore: {
          $add: [
            "$exactMatchScore",
            "$popularityScore",
            { $multiply: ["$recencyScore", 2] }
          ]
        }
      }
    },
  ]

}

export const getSearchPipelineForRooms = (query: string, uid: string, page: number): PipelineStage[] => {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const regex = tokens.map(token => ({ name: { $regex: token, $options: 'i' } }));

  return [
    { $match: { user_id: uid, $or: regex } },
    { $skip: page * queryLimit },
    { $limit: queryLimit },
    {
      $project: {
        _id: 1,
        poster: 1,
        display_name: "$name"
      }
    },
    {
      $facet: {
        total: [{ $count: "total" }],
        data: [],
      }
    },
    {
      $project: {
        total: {
          $arrayElemAt: ["$total.total", 0]
        },
        data: 1
      }
    }
  ]

}

export const searchHandler = async ({ r, type, filters }: SearchHandlerProps): Promise<GeneralGetReturn> => {

  const sp = r.nextUrl.searchParams;

  const query: string | undefined = sp.get("q")?.trim();
  if (!query || query.length < 1)
    return { success: false, errCode: "custom_error", customError: "Query is empty. Query must be sent under the searchParams 'q'." };

  const { page, nsfw } = getSearchParams(r.nextUrl);

  const searchFilters =
    type === "posts" ? getSearchPipelineForPosts(query, nsfw)
      : type === "threads" ? getSearchPipelineForThreads(query, nsfw)
        : type === "users" ? getSearchPipelineForUsers(query)
          : type === "shelves" ? getSearchPipelineForShelves(query)
            : null;

  if (!searchFilters || !searchFilters.length) throw new Error(`Incorrect type passed in search handler, got: ${type}`)

  const pipeline: PipelineStage[] = [
    ...(type === "shelves" ? filters : []),
    ...searchFilters,
    { $skip: Math.floor(page / 5) * queryLimit },
    { $limit: queryLimit * 5 },
    ...(type !== "shelves" ? filters : [])
  ];

  const response = await performAggregation({ filters: pipeline, page, type, sort: { finalScore: -1 } });

  return { success: true, result: response[0] ?? { data: [], total: 0 } }

}

export const roomAggregationPipeline = ({ invitation, page, cuid, }: { invitation: boolean; page: number; cuid: string; }) =>
  createPipeline({
    filters: [
      {
        $match: {
          user_id: cuid,
          type: invitation ? { $eq: "invitee" } : { $ne: "invitee" },
        },
      },
      {
        $lookup: {
          from: "rooms",
          let: { hideAt: "$hideAt", room_id: "$room_id" },
          pipeline: [
            convertMatchToLookupExpr({ _id: "$$room_id", $gt: ["$lastMessageAt", "$$hideAt"] }),
            {
              $project: {
                type: 1,
                lastMessageBy: 1,
                lastMessageAt: 1,
                invitationMessage: 1,
                name: 1,
                poster: 1,
              }
            }
          ],
          as: "room",
        },
      },
    ],
    preProjection: [
      {
        $addFields: {
          isPrivate: {
            $eq: [
              { $arrayElemAt: ["$room.type", 0] },
              "private"
            ]
          }
        },
      },
      {
        $lookup: {
          from: "participants",
          let: { room_id: "$room_id", isPrivate: "$isPrivate", cuid: "$user_id" },
          pipeline: [
            convertMatchToLookupExpr({
              "$isPrivate": true,
              room_id: "$$room_id",
              user_id: { $ne: "$$cuid" }
            }),
            { $limit: 1 },
            { $project: { user_id: 1, seen_at: 1 } }
          ],
          as: "other_participant",
        },
      },
      {
        $lookup: {
          from: "users",
          let: {
            uid: { $arrayElemAt: ["$other_participant.user_id", 0] },
            isPrivate: "$isPrivate",
          },
          pipeline: [
            convertMatchToLookupExpr({
              "$isPrivate": true,
              _id: "$$uid"
            }),
            { $project: { username: 1, profile: 1 } }
          ],
          as: "user",
        },
      },
      {
        $match: {
          $expr: {
            $or: [
              { $eq: ["$isPrivate", false] },
              { $eq: [{ $size: "$user" }, 1] },
            ],
          },
        },
      },
      {
        $addFields: {
          display_name: {
            $cond: {
              if: "$isPrivate",
              then: {
                $arrayElemAt: ["$user.username", 0]
              },
              else: {
                $arrayElemAt: ["$room.name", 0]
              }
            }
          },
          poster: {
            $cond: {
              if: "$isPrivate",
              then: {
                $arrayElemAt: ["$user.profile", 0]
              },
              else: {
                $arrayElemAt: ["$room.poster", 0]
              }
            }
          },
          otherParticipant_seenAt: {
            $cond: {
              if: "$isPrivate",
              then: {
                $arrayElemAt: [
                  "$other_participant.seenAt",
                  0
                ]
              },
              else: undefined
            }
          },
          otherParticipant_id: {
            $cond: {
              if: "$isPrivate",
              then: {
                $arrayElemAt: [
                  "$other_participant.user_id",
                  0
                ]
              },
              else: undefined
            }
          },
          room_type: {
            $arrayElemAt: ["$room.type", 0],
          },
          lastMessageBy: {
            $arrayElemAt: ["$room.lastMessageBy", 0],
          },
          lastMessageAt: {
            $arrayElemAt: ["$room.lastMessageAt", 0],
          },
          invitationMessage: {
            $arrayElemAt: ["$room.invitationMessage", 0],
          },
        },
      },
    ],
    page,
    sort: { lastMessageAt: -1 },
    projection: {
      display_name: 1,
      user_id: 1,
      poster: 1,
      seenAt: 1,
      type: 1,
      otherParticipant_id: 1,
      otherParticipant_seenAt: 1,
      lastMessageBy: 1,
      lastMessageAt: 1,
      lastMessage: 1,
      invitationMessage: 1,
      mute: 1,
      room_id: 1,
      room_type: 1,
    },
  });

export const reportAggregationPipeline = (content_id: string, type: "post" | "comment" | "thread" | "user" | undefined) => [
  {
    $match: {
      content_id: content_id,
      ...(type && { content_type: capitalize(type) })
    }
  },
  {
    $group: {
      "_id": "$reason",
      count: {
        $sum: 1
      }
    }
  },
  {
    $project: {
      count: 1,
    }
  }
]

export const reportedContentAggregation = ({ content_type, thread_id, page }: { content_type: "Post" | "Comment", thread_id: string, page: number }): PipelineStage[] => {

  const contentType = `${content_type.toLowerCase()}s`;

  const postFields: (keyof PostModelType)[] = ["title", "category", "frames"];
  const commentFields: (keyof CommentModelType)[] = ["content", "attachment"];
  const commonFields: any[] = ["user_id", "warnedOn", "createdAt", "nsfw", "spoiler"];

  const finalContentFields = content_type === "Post" ? postFields : commentFields;

  return createPipeline({
    filters: [
      {
        $match: { content_type, ext_id: thread_id }
      },
      {
        $group: {
          _id: "$content_id",
          reasons: {
            $push: "$reason"
          },
          total: { $sum: 1 },
        }
      },
    ],
    page: page > 0 ? page - 1 : page,
    preProjection: [
      {
        $lookup: {
          from: contentType,
          localField: "_id",
          pipeline: [
            {
              $project: finalContentFields.concat(commonFields).reduce(
                (obj, key) => ({ ...obj, [key]: 1 }),
                {}
              )
            }
          ],
          foreignField: "_id",
          as: "contents",
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "contents.user_id",
          pipeline: [
            {
              $project: { username: 1, profile: 1 }
            }
          ],
          foreignField: "_id",
          as: "user",
        }
      },
      {
        $addFields: {
          content: {
            $arrayElemAt: ["$contents", 0]
          },
          author: {
            $arrayElemAt: ["$user", 0]
          },
        }
      },
    ],
    sort: { total: -1 },
    projection: {
      _id: 1,
      total: 1,
      content: 1,
      author: 1,
      reasons: {
        $arrayToObject: {
          $map: {
            input: {
              $setUnion: [
                "$reasons",
                []
              ]
            },
            as: "r",
            in: {
              k: "$$r",
              v: {
                $size: {
                  $filter: {
                    input: "$reasons",
                    as: "reason",
                    cond: {
                      $eq: [
                        "$$reason",
                        "$$r"
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      },
    }
  });
}