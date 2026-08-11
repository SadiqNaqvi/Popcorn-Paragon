import { extMediaSource } from "@lib/shared/constants";
import {
  BasedOnModelType,
  FrameModelType,
  LinkModelType
} from "@type/models";
import { Schema } from "@type/mongoose";

export const numberSchema = {
  type: Number,
  default: 0,
  set: (value: number) => Math.max(value, 0),
}

export const linkModel = new Schema<LinkModelType>({
  label: {
    type: String,
    required: [true, "Label for a Link is required."],
  },
  path: {
    type: String,
    required: [true, "Path for a Link is required"],
  },
});

export const basedOnModel = new Schema<BasedOnModelType>({
  type: {
    type: String,
    enum: ["person", "movie", "show"],
    required: true,
  },
  extid: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

export const frameModel = new Schema<FrameModelType>({
  path: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },
  isExternal: Boolean,
  hash: String,
  size: Number,
  extSource: {
    type: String,
    enum: extMediaSource,
    required: false,
  },
  duration: Number,
  thumb: String,
});