import stripTags from "striptags";
import he from "he";
const maxChars = 240;

function cleanup(text) {
  return stripTags(he.decode(text));
}
function getSentences(text, maxChars) {
  const sentences = text
    .split(". ")
    .filter((sentence) => sentence.match(/[A-Za-z]/))
    .map((sentence) => sentence + ".");
  let sentence = "";
  let i = 0;
  while (
    typeof sentences[i] === "string" &&
    sentence.length + sentences[i].length + 1 < maxChars
  ) {
    sentence = String(sentence + " " + sentences[i]).trim();
    i += 1;
  }

  // Acronyms like U.S. break
  const hasAcronym = sentence.match(/\w\.\w\./);
  if (hasAcronym) {
    return "";
  }

  return sentence.replace(/\.\./g, ".").replace(/\[...\]/g, "");
}

export function title(config, feed, item, options) {
  return [
    cleanup(item.title).substr(0, feed.options?.maxChars || maxChars),
    item.link,
  ].join("\n\n");
}

export function description(config, feed, item, options) {
  if (!item.description) debugger;
  let sentence = getSentences(
    cleanup(item.description),
    feed.options?.maxChars || maxChars
  );

  if (!sentence || sentence.length < 50) {
    return title(config, feed, item, options);
  }
  return [sentence, item.link].join("\n\n");
}

export function descriptionAfterLandmark(config, feed, item, options) {
  const landmarkPosition = item.description.indexOf(
    feed.options.descriptionAfterLandmark
  );

  if (landmarkPosition === -1) {
    return description(config, feed, item, options);
  }
  const newItem = {
    ...item,
    description: item.description.substr(landmarkPosition),
  };

  return description(config, feed, newItem, options);
}

export function titleWithDescription(config, feed, item, options) {
  let post = cleanup(item.title).substr(0, feed.options?.maxChars || maxChars);
  const sentence = getSentences(
    cleanup(item.description),
    (feed.options?.maxChars || maxChars) - title.length
  );

  if (sentence) post = post + " - " + sentence;

  return [post, item.link].join("\n\n");
}
