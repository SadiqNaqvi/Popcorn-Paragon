import { getHandler } from "@lib/backend/helpers/handlers";
import { createPipeline, getSearchPipelineForRooms, getSearchPipelineForUsers } from "@lib/backend/helpers/pipelines";
import { getSearchParams } from "@lib/backend/utils";
import { queryLimit } from "@lib/shared/constants";
import { Room, User } from "@model";
import { AggregatedResponse } from "@type/internal";
import type { PipelineStage } from "@type/mongoose";

// Search all the rooms (private/group) of the current user
export const GET = getHandler(async (r, params) => {
    const { cuid } = params;

    const { query, page } = getSearchParams(r.nextUrl, 0);

    if (!query?.trim().length)
        return { success: false, errCode: "custom_error", custom_error: "Query is required" }

    const createFilters = (paths: string[], index: string): PipelineStage[] => ([
        {
            $search: {
                index,
                compound: {
                    should: paths.map((path) => ({
                        autocomplete: {
                            query,
                            path,
                            fuzzy: { maxEdits: 2, prefixLength: 1 },
                        },
                    })),
                },
            },
        },
        {
            $addFields: {
                score: { $meta: "searchScore" },
            },
        },
        { $sort: { score: -1 } },
        { $skip: page * queryLimit },
        { $limit: 100 },
    ]);

    // const roomPipeline = [
    //     ...createFilters(["name"], "searchIndexForRooms_name"),
    //     {
    //         $lookup: {
    //             from: "participants",
    //             let: { rmid: "$_id" },
    //             pipeline: [
    //                 convertMatchToLookupExpr({
    //                     user_id: cuid,
    //                     room_id: "$$rmid"
    //                 }),
    //                 { $count: "exists" }
    //             ],
    //             as: "participant"
    //         },
    //     },
    //     { $match: { $expr: { $eq: [{ $size: "$participant" }, 1] } } },
    //     {
    //         $facet: {
    //             total: [{ $count: "total" }],
    //             data: [
    //                 { $limit: queryLimit },
    //                 {
    //                     $project: {
    //                         _id: 1,
    //                         poster: 1,
    //                         display_name: "$name"
    //                     }
    //                 }
    //             ]
    //         }
    //     },
    //     {
    //         $project: {
    //             total: {
    //                 $arrayElemAt: ["$total.total", 0]
    //             },
    //             data: 1
    //         }
    //     }
    // ];

    // const userPipeline = [
    //     ...createFilters(["name", "username"], "searchIndexForUsers_username_name"),
    //     {
    //         $addFields: {
    //             participants: {
    //                 $sortArray: {
    //                     input: ["$_id", cuid],
    //                     sortBy: 1
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         $lookup: {
    //             from: "rooms",
    //             let: { participants: "$participants" },
    //             pipeline: [
    //                 {
    //                     $match: {
    //                         $expr: {
    //                             $eq: [
    //                                 "$participants",
    //                                 "$$participants"
    //                             ]
    //                         }
    //                     }
    //                 },
    //                 { $project: { _id: 1 } }
    //             ],
    //             as: "room"
    //         }
    //     },
    //     {
    //         $match: {
    //             $expr: { $eq: [{ $size: "$room" }, 1] }
    //         }
    //     },
    //     {
    //         $facet: {
    //             total: [{ $count: "total" }],
    //             data: [
    //                 {
    //                     $project: {
    //                         _id: { $arrayElemAt: ["$room._id", 0] },
    //                         display_name: "$username",
    //                         poster: "$profile"
    //                     }
    //                 }
    //             ]
    //         }
    //     },
    //     {
    //         $project: {
    //             total: {
    //                 $arrayElemAt: ["$total.total", 0]
    //             },
    //             data: 1
    //         }
    //     }
    // ];

    const userPipeline = [
        ...getSearchPipelineForUsers(query),
        { $sort: { finalScore: -1 } as Record<string, -1> },
        { $skip: Math.floor(page / 5) * queryLimit },
        { $limit: queryLimit * 5 },
        {
            $addFields: {
                participants: {
                    $sortArray: {
                        input: ["$_id", cuid],
                        sortBy: 1
                    }
                }
            }
        },
        {
            $lookup: {
                from: "rooms",
                let: { participants: "$participants" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: [
                                    "$participants",
                                    "$$participants"
                                ]
                            }
                        }
                    },
                    { $project: { _id: 1, lastMessage: 1, lastMessageAt: 1, lastMessageBy: 1 } }
                ],
                as: "room"
            }
        },
        {
            $match: {
                $expr: { $eq: [{ $size: "$room" }, 1] }
            }
        }
    ]

    const [roomsResponse, usersResponse] = await Promise.all([
        Room.aggregate<AggregatedResponse>(getSearchPipelineForRooms(query, cuid, page)),
        User.aggregate<AggregatedResponse>(createPipeline({
            filters: userPipeline,
            sort: { finalScore: -1 },
            page,
            projection: { username: 1, poster: 1, room: 1 },
        })),
    ]);

    const roomResult = roomsResponse[0];
    const userResult = usersResponse[0];

    const data = [
        ...(roomResult.data || []),
        ... (userResult.data || []).map(u => {
            const room = u.room[0];
            return {
                ...(room || {}),
                display_name: u.username,
                poster: u.profile,
            }
        })
    ];
    const total = (roomResult.total || 0) + (userResult.total || 0);

    return { success: true, result: { data, total } }
});