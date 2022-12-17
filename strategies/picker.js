export async function lastPosted(config, feed, items, options) {
  const lastPosted = feed.lastPosted || 0;
  const foundPosts = items.filter((post) => new Date(post.date) > lastPosted);

  return foundPosts;
}

export async function grep(
  config,
  feed,
  items,
  { keywords = [], excludes = [] }
) {
  return items
    .filter((post) =>
      keywords.some(
        (keyword) =>
          post.title.toLowerCase().includes(keyword.toLowerCase()) ||
          post.description.toLowerCase().includes(keyword.toLowerCase()) ||
          post.link.toLowerCase().includes(keyword.toLowerCase())
      )
    )
    .filter((post) =>
      excludes.every(
        (keyword) =>
          !post.title.toLowerCase().includes(keyword.toLowerCase()) &&
          !post.description.toLowerCase().includes(keyword.toLowerCase()) &&
          !post.link.toLowerCase().includes(keyword.toLowerCase())
      )
    );
}
