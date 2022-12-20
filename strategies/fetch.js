export function full(config, feed) {
  console.log(config.filename, "fetching", "fetch", "full", feed.url);
  return fetch(feed.url)
    .then((res) => {
      return res.text();
    })
    .then((text) => {
      Object.assign(feed, {
        lastUpdated: new Date(),
        text,
      });
    });
}

export async function lastUpdated(config, feed) {
  console.log(config.filename, "fetching", "fetch", "lastUpdated", feed.url);
  const res = feed.lastUpdated && (await fetch(feed.url, { method: "HEAD" }));
  const lastUpdatedHeader = res && res.headers["last-updated"];

  if (!lastUpdatedHeader || feed.lastUpdated < new Date(lastUpdatedHeader)) {
    return full(config, feed);
  }
  return feed;
}
