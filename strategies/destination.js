import { login } from "masto";
import fs from "fs";

const queues = {};

setInterval(function mastodonQueueChecker() {
  Object.entries(queues).forEach(([configFile, queue]) => {
    const item = queue.shift();
    console.log(
      configFile,
      "queue",
      "mastodonQueueChecker",
      item ? "empty" : "posting"
    );
    if (!item) return;

    mastodon(...item);
  });
}, 1000 * 60);

export async function textFile(config, feed, text) {
  fs.appendFileSync("posts.txt", text + "\n----------\n");
  return text;
}

/**
 * Create mastodon config from environment variables.
 * @param {object} config
 */
function getMastodonEnvConfig(config) {
  const mastodonSuffix = config.strategies.mastodonSuffix;
  const urlKey = `MASTODON_URL_${mastodonSuffix}`;
  const accessTokenKey = `MASTODON_ACCESS_TOKEN_${mastodonSuffix}`;
  const mastodonConfig = {
    url: process.env[urlKey],
    accessToken: process.env[accessTokenKey],
  };
  if (!mastodonConfig.url) {
    throw new Error(urlKey + " not set");
  }
  if (!mastodonConfig.accessToken) {
    throw new Error(accessTokenKey + " not set");
  }
  return mastodonConfig;
}

export async function mastodonQueued(...args) {
  if (!queues[config.filename]) {
    queues[config.filename] = [];
  }
  const queue = queues[config.filename];

  if (queue.length === 0) {
    return mastodon(...args);
  }

  queue.push(args);

  console.log(
    config.filename,
    "queued",
    "destination",
    "mastodon",
    args[2].split("\n")[0].slice(0, 20) + "…"
  );

  if (queue.length > 10) {
    const item = queue.shift();
    console.log(
      config.filename,
      "skipping",
      "destination",
      "mastodon",
      item[2].split("\n")[0].slice(0, 20) + "…"
    );
  }
}
export async function mastodon(
  config,
  feed,
  text,
  { url, accessToken, visibility = "unlisted" }
) {
  console.log(
    config.filename,
    "posting",
    "destination",
    "mastodon",
    text.split("\n")[0].slice(0, 20) + "…"
  );

  // only post to Masto in production
  if (process.env.NODE_ENV !== "production") {
    return text;
  }
  try {
    const mastodon = await login(getMastodonEnvConfig(config));
    await mastodon.statuses.create({
      status: text,
      visibility: visibility,
    });
    feed.lastPosted = Date.now();
  } catch (e) {
    console.log(config.filename, "error", "destination", "mastodon", e.message);
  }

  return text;
}
