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
program.requiredOption("-c, --config-dir <url>");

program.parse();

const options = program.opts();

const dir = path.resolve(process.cwd(), options.configDir);
const configs = fs
  .readdirSync(dir)
  .filter((filename) => !filename.includes("-state.json"))
  .map((filename) => ({
    filename,
    ...JSON.parse(fs.readFileSync(path.resolve(dir, filename), "utf-8")),
  }));

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
    await fetchStrategies[feed.strategies.fetch || "full"](config, feed);
    await parserStrategies[feed.strategies.parser || "feed"](config, feed);

    debugger;

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
    console.error(config.filename, "ohno", e);
  }
  fs.writeFileSync(
    path.resolve(dir, config.filename.replace(".json", "-state.json")),
    JSON.stringify(config, null, 2)
  );
}

async function runLoop(config) {
  const _runLoop = () => {
    async.eachLimit(Object.values(config.items), 4, async (feed) => {
      try {
        await runFeed(config, feed);
      } catch (e) {
        console.log(config.filename, "runFeed failed", e.message);
      }
    });
    console.log(config.filename, "done");
  };
  _runLoop();
  setInterval(_runLoop, 1000 * 60 * 7 + Math.random());
}

function startConfig(config) {
  (config.strategies.lastUpdatedFeed
    ? fetch(config.strategies.lastUpdatedFeed).then((res) => res.text())
    : Promise.resolve()
  ).then(async (text) => {
    if (text) {
      // get the last post date from Mastodon and use it to reset everything
      const feed = await parserStrategies.parseFeed(config, text);

      const lastPostDate = new Date(feed[0].date);
      Object.keys(config.items).forEach((key) => {
        config.items[key].lastPosted = lastPostDate;
        config.items[key].lastUpdated = lastPostDate;
      });
      console.log(
        config.filename,
        "starting",
        "starting",
        "lastPostDate",
        lastPostDate
      );
    }

    // OK now we can go
    runLoop(config);
  });
}

configs.forEach(startConfig);
