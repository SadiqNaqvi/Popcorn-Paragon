import mongoose from "mongoose";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

declare global {
  var mongooseGlobal: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

global.mongooseGlobal ??= {
  conn: null,
  promise: null,
};

export async function connectDatabase() {
  if (global.mongooseGlobal.conn && mongoose.connection.readyState === 1) {
    console.log("Mongo DB Was already connected")
    return global.mongooseGlobal.conn;
  }

  else if (!process.env.MONGODB_URI) {
    console.error("MongoDb Uri is not available");
    return null;
  }

  try {
    if (!global.mongooseGlobal.promise) {
      global.mongooseGlobal.promise = mongoose.connect(process.env.MONGODB_URI);
    }

    global.mongooseGlobal.conn = await global.mongooseGlobal.promise;
    console.log("MongoDB Connected Successfully.");
    return global.mongooseGlobal.conn;
  } catch (err: any) {
    console.log("MongoDB connection failed: ", err.message);
    return null;
  }
}
