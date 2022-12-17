import FeedParser from "feedparser";
import Stream from "stream";

export async function parseFeed(text) {
  const items = [];
  let meta = {};
  await new Promise((resolve, reject) => {
    var feedParser = new FeedParser()
      .on("error", (e) => {
        console.error("feedParser broke", e);
        throw e;
      })
      .on("readable", function () {
        var stream = this;
        var item;
        while ((item = stream.read())) {
          items.push({
            title: item.title,
            description: item.description,
            date: new Date(item.date).toISOString(),
            link: item.link,
          });
        }
      })
      .on("end", resolve);
    const readableStream = Stream.Readable.from(String(text)).pipe(feedParser);
  });

  return items;
}

export async function feed(feed) {
  const items = await parseFeed(feed.text);
  return Object.assign(feed, {
    parsed: items,
  });
}
