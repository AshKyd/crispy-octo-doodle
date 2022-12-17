import { program } from "commander";
import fs from "fs";
import path from "path";
import process from "process";
import async from "async";
import deepMerge from "deepmerge";
import * as fetchStrategies from "./strategies/fetch.js";
import * as parserStrategies from "./strategies/parser.js";
import * as pickerStrategies from "./strategies/picker.js";
import * as formatterStrategies from "./strategies/formatter.js";
import * as destinationStrategies from "./strategies/destination.js";
program.requiredOption("-f, --feed <url>");

program.parse();

const options = program.opts();

const filename = path.resolve(process.cwd(), options.feed);
const stateFilename = filename.replace(".json", "-state.json");
let config = JSON.parse(fs.readFileSync(filename, "utf8"));

function updateConfig() {
  fs.writeFileSync(stateFilename, JSON.stringify(config, null, 2));
}

async function runStrategy(strategies, strategy, config, feed, item) {
  const normalisedStrategy = (Array.isArray(strategy) ? strategy : [strategy])
    .map((entry) => {
      if (typeof entry === "string") {
        return { name: entry };
      }
      return entry;
    })
    .filter(Boolean);

  for (let i = 0; i < normalisedStrategy.length; i++) {
    const { name, options } = normalisedStrategy[i];
    const strategyRunner = strategies[name];
    item = await strategyRunner(config, feed, item, options);
  }
  return item;
}

async function runFeed(config, feed) {
  try {
    await fetchStrategies[feed.strategies.fetch || "full"](feed);
    await parserStrategies[feed.strategies.parser || "feed"](feed);

    // pick out posts
    const newPosts = await runStrategy(
      pickerStrategies,
      feed.strategies.picker || "lastPosted",
      config,
      feed,
      feed.parsed
    );

    // format posts
    const formattedPosts = await Promise.all(
      newPosts.map((item) => {
        return runStrategy(
          formatterStrategies,
          feed.strategies.formatter || "description",
          config,
          feed,
          item
        );
      })
    );

    await Promise.all(
      formattedPosts.map((item) => {
        return runStrategy(
          destinationStrategies,
          config.strategies.destination,
          config,
          feed,
          item
        );
      })
    );
  } catch (e) {
    console.error("ohh no", e);
  }
  updateConfig();
}

async function runLoop() {
  await async.eachLimit(Object.values(config.items), 4, async (feed) => {
    return await runFeed(config, feed);
  });
  console.log("done all them");

  setTimeout(runLoop, 1000 * 60 * 7);
}

(config.strategies.lastUpdatedFeed
  ? fetch(config.strategies.lastUpdatedFeed).then((res) => res.text())
  : Promise.resolve()
).then(async (text) => {
  if (text) {
    // get the last post date from Mastodon and use it to reset everything
    const feed = await parserStrategies.parseFeed(text);
    const lastPostDate = new Date(feed[0].date);
    Object.keys(config.items).forEach((key) => {
      config.items[key].lastPosted = lastPostDate;
      config.items[key].lastUpdated = lastPostDate;
    });
    console.log("starting", "starting", "lastPostDate", lastPostDate);
  }

  // OK now we can go
  runLoop();
});
