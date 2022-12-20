import { login } from "masto";
import fs from "fs";

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
