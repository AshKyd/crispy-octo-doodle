import { login } from "masto";
import fs from "fs";

export async function textFile(config, feed, text) {
  fs.appendFileSync("posts.txt", text + "\n----------\n");
  return text;
}
export async function mastodon(
  config,
  feed,
  text,
  { url, accessToken, visibility = "unlisted" }
) {
  console.log(
    "posting",
    "destination",
    "mastodon",
    text.split("\n")[0].slice(0, 20) + "…"
  );
  try {
    const mastodon = await login({
      url: process.env.MASTODON_URL,
      accessToken: process.env.MASTODON_ACCESS_TOKEN,
    });
    await mastodon.statuses.create({
      status: text,
      visibility: visibility,
    });
    feed.lastPosted = Date.now();
  } catch (e) {
    console.log("error", "destination", "mastodon", e.message);
  }

  return text;
}
