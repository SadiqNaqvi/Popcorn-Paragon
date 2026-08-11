import { sendAppNotification, sendPushNotification } from "@lib/backend/actions/notification";
import { getHandler, postHandler, updateHandler } from "@lib/backend/helpers/handlers";
import { getAblyRest } from "@lib/backend/providers/ably";
import { capitalize } from "@lib/shared/utils";
import { reportActionSchema } from "@lib/shared/validation/schemas";
import { Comment, Member, Notification, Post } from "@model";
import Report from "@model/reports";
import { NotificationModelType } from "@type/models";
import { ReportActionSchemaType, ReportSchemaType } from "@type/schemas";
import { PushSubscription } from "web-push";

// Check if the content is reported by the current user and return report's metadata.
// Here id is content_id
export const GET = getHandler(async (r, params) => {

  const search = r.nextUrl.searchParams;
  const ctype = search.get("type")?.toLowerCase()||search.get("t")?.toLowerCase();
  const { id } = params;

  if (!ctype || !["comment", "post", "thread", "user"].includes(ctype)) return {
    success: false,
    errCode: "invalid_input",
    customError: "Invalid content type",
  };

  const result = await Report.findOne({
    user_id: params.cuid,
    content_type: capitalize(ctype),
    content_id: id,
  }).exec();

  return { success: true, result };
});

// Creating a new report
export const POST = postHandler<ReportSchemaType>({
  handler: async ({ data, user_id }) => {

    await Report.create([{
      ...data,
      content_type: capitalize(data.content_type),
      user_id
    }]);

    return {
      success: true,
      result: null,
      revalidateQueue: [],
    };
  },
});

type PipelineProp = {
  contentsToDelete: string[],
  contentsToWarnAuthor: string[],
  type: "post" | "comment",
  key: "title" | "content"
}

type Content = {
  _id: string,
  user_id: string,
  title: string,
  content: string,
  push_auth: string | undefined,
  push_endpoint: string | undefined,
  push_p256dh: string | undefined,
};

type PipelineResult = {
  forDeletion: Content[]
  forWarning: Content[]
}

const getContents = async ({ contentsToDelete, contentsToWarnAuthor, type, key }: PipelineProp) => {
  const Model = type === "post" ? Post : Comment;
  const result = await Model.aggregate<PipelineResult>([
    {
      $facet: {
        postsToDelete: [
          { $match: { _id: { $in: contentsToDelete } } },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              pipeline: [{ $project: { push_auth: 1, push_endpoint: 1, push_p256dh: 1 } }],
              as: "user",
            }
          },
          {
            $addFields: {
              push_auth: { $arrayElemAt: ["$user.push_auth", 0] },
              push_endpoint: { $arrayElemAt: ["$user.push_endpoint", 0] },
              push_p256dh: { $arrayElemAt: ["$user.push_p256dh", 0] }
            }
          },
          {
            $project: {
              _id: 1,
              [key]: 1,
              user_id: 1,
              push_auth: 1,
              push_endpoint: 1,
              push_p256dh: 1,
            }
          }
        ],
        contentForWarning: [
          { $match: { _id: { $in: contentsToWarnAuthor } } },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              pipeline: [{ $project: { push_auth: 1, push_endpoint: 1, push_p256dh: 1 } }],
              as: "user",
            }
          },
          {
            $addFields: {
              push_auth: { $arrayElemAt: ["$user.push_auth", 0] },
              push_endpoint: { $arrayElemAt: ["$user.push_endpoint", 0] },
              push_p256dh: { $arrayElemAt: ["$user.push_p256dh", 0] }
            }
          },
          {
            $project: {
              _id: 1,
              [key]: 1,
              user_id: 1,
              push_auth: 1,
              push_endpoint: 1,
              push_p256dh: 1,
            }
          }
        ]
      }
    }
  ]);

  return result[0]
}

// Actions taken by Managers on reported contents.
export const PATCH = updateHandler<ReportActionSchemaType>({
  handler: async ({ data, user_id, session }) => {

    const { actions, type } = data;
    let contentsToDelete: string[] = [];
    let contentsToKeep: string[] = [];
    let contentsToWarnAuthor: string[] = [];

    actions.forEach(action => {
      if (action.action === "delete") {
        contentsToDelete.push(action.id);
      }
      else if (action.action === "keep") {
        contentsToKeep.push(action.id);
      } else contentsToWarnAuthor.push(action.id)
    });

    await Report.deleteMany({
      content_id: { $in: contentsToDelete.concat(contentsToKeep) }
    }, { session });

    const payload = {
      _id: { $in: contentsToDelete }
    }

    if (type === "post") {
      await Post.deleteMany(payload, { session });
    } else {
      await Comment.deleteMany(payload, { session });
    }

    const { forDeletion, forWarning } = await getContents({
      type,
      contentsToDelete,
      contentsToWarnAuthor,
      key: type === "post" ? "title" : "content"
    });

    await Member.findOneAndUpdate(
      { user_id },
      {
        $inc: {
          actionsTaken: contentsToDelete.length + contentsToKeep.length
        }
      },
      { session }
    );

    const ably = getAblyRest();

    const uidToPushPayload: Record<string, PushSubscription> = {};

    // Sending notifications to the author of the content whose post/comment has been deleted
    let notifications: NotificationModelType[] = [];

    forDeletion.forEach((content) => {
      const content_title = type === "post" ? content.title : content.content;
      if (content.push_auth && content.push_endpoint && content.push_p256dh) {
        uidToPushPayload[content.user_id] = {
          endpoint: content.push_endpoint,
          keys: {
            auth: content.push_auth,
            p256dh: content.push_p256dh,
          }
        }
      }
      notifications.push({
        title: `Your ${type} has been deleted.`,
        poster: undefined,
        message: [
          {
            type: "text",
            text: `Your ${type} 
              '${content_title.slice(0, 50).concat(content_title.length > 50 ? "..." : '')}' 
              has been deleted.`
          },
        ],
        user_id: content.user_id,
      })
    });

    // Sending Warning to the author of the post/comment.
    forWarning.forEach(content => {

      const content_title = type === "post" ? content.title : content.content;
      const path = `/${type}/${content._id}/reports`;

      if (content.push_auth && content.push_endpoint && content.push_p256dh) {
        uidToPushPayload[content.user_id] = {
          endpoint: content.push_endpoint,
          keys: {
            auth: content.push_auth,
            p256dh: content.push_p256dh,
          }
        }
      }

      notifications.push({
        title: `Immediate Action Required.`,
        poster: undefined,
        message: [
          { type: "text", text: `You are being warned because your ${type}` },
          {
            type: "link",
            label: `${content_title.slice(0, 50).concat(content_title.length > 50 ? "..." : '')}`,
            path
          },
          {
            type: "text", text: `has been reported multiple times. Please update your ${type} accordingly or actions will be taken against it.`
          },
        ],
        user_id: content.user_id,
        path,
      })
    });

    await Notification.create(notifications, { session });

    await Promise.all(
      notifications.map(async n => {
        const uid = n.user_id;
        const isOnline = await ably.channels.get(uid)
          .presence.get()
          .then(r => !!r.items.length);

        if (isOnline) {
          return sendAppNotification(uid, n.title)
        } else {
          const subscription = uidToPushPayload[uid];
          if (!subscription) return;
          return sendPushNotification(
            subscription,
            {
              title: n.title,
              body: n.message.map(n => n.type === "link" ? n.label : n.text).join(' '),
              icon: n.poster,
            },
            true
          )
        }

      })
    )

    return {
      success: true,
      result: null,
      revalidateQueue: forWarning
        .concat(forDeletion)
        .map(el => `notifications-user-${el.user_id}`)
        .concat(contentsToKeep.map(el => `reports-${el}`)),
    }
  },

  preCheck: async ({ params, user_id }) => {
    const isManager = await Member.exists({
      thread_id: params.id,
      user_id,
      role: { $in: ["creator", "moderator"] }
    });

    if (isManager) return { success: true }
    return { success: false, errCode: "unauthorized_access" }
  },
  schema: reportActionSchema,
});