import {
  title,
  description,
  descriptionAfterLandmark,
  titleWithDescription,
} from "./formatter.js";

describe("formatter", () => {
  describe("title", () => {
    const item = {
      title:
        "Musk ragequits Twitter Space meeting after journalist asks difficult question about ElonJet, then shuts down the Twitter Space, then shuts down Twitter Spaces entirely",
      link: "https://example.org",
    };
    it("should return the title verbatim", () => {
      expect(title({}, {}, item, {})).toEqual(
        [item.title, item.link].join("\n\n")
      );
    });
    it("should hard truncate", () => {
      expect(title({}, { options: { maxChars: 14 } }, item, {})).toEqual(
        ["Musk ragequits", item.link].join("\n\n")
      );
    });
  });
  describe("description", () => {
    const sentences = [
      "After banning journalists from The New York Times, Washington Post, CNN and elsewhere last night, Elon Musk hopped into a Twitter Spaces chat being held by other journalists discussing the bans.",
      'He reiterated his claim that posting publicly-available data about air travel, such as his private jet\'s, is "doxxing".',
    ];
    const item = {
      title:
        "Musk ragequits Twitter Space meeting after journalist asks difficult question about ElonJet, then shuts down the Twitter Space, then shuts down Twitter Spaces entirely",
      description: sentences.join(" "),
    };
    it("should return the first sentence of the description", () => {
      expect(description({}, {}, item, {})).toEqual(
        [sentences[0], item.link].join("\n\n")
      );
    });
    it("should return the whole description when the character limit is lifted", () => {
      expect(
        description({}, { options: { maxChars: Infinity } }, item, {})
      ).toEqual([item.description, item.link].join("\n\n"));
    });
    it("should defer to the title formatter when the sentence is too long", () => {
      expect(title({}, { options: { maxChars: 14 } }, item, {})).toEqual(
        ["Musk ragequits", item.link].join("\n\n")
      );
    });
    it('should use quotes when the description starts with "i"', () => {
      const item = {
        title: "Musk ragequits",
        description:
          "I was banned again minutes after I posted the last update. What a shitshow.",
      };
      expect(
        description({}, { options: { maxChars: Infinity } }, item, {})
      ).toEqual(
        [
          "“I was banned again minutes after I posted the last update. What a shitshow.”",
          item.link,
        ].join("\n\n")
      );
    });
  });
  describe("descriptionAfterLandmark", () => {
    const feed = { options: { descriptionAfterLandmark: "</figure>" } };
    it("should tidy up the description after the given landmark", () => {
      const sentences = [
        "<figure>Some bad content we dont' want to publish</figure>",
        "After banning journalists from The New York Times, Washington Post, CNN and elsewhere last night, Elon Musk hopped into a Twitter Spaces chat being held by other journalists discussing the bans.",
        ,
      ];
      const item = {
        title: "Musk ragequits",
        description: sentences.join(" "),
      };
      expect(descriptionAfterLandmark({}, feed, item, {})).toEqual(
        [sentences[1], item.link].join("\n\n")
      );
    });
    it("should work as per normal when the landmark isn't found", () => {
      const sentences = [
        "After banning journalists from The New York Times, Washington Post, CNN and elsewhere last night, Elon Musk hopped into a Twitter Spaces chat being held by other journalists discussing the bans.",
        ,
      ];
      const item = {
        title: "Musk ragequits",
        description: sentences.join(" "),
      };
      expect(descriptionAfterLandmark({}, feed, item, {})).toEqual(
        [sentences[0], item.link].join("\n\n")
      );
    });
  });

  describe("titleWithDescription", () => {
    const sentences = [
      "After banning journalists from The New York Times, Washington Post, CNN and elsewhere last night, Elon Musk hopped into a Twitter Spaces chat being held by other journalists discussing the bans.",
      'He reiterated his claim that posting publicly-available data about air travel, such as his private jet\'s, is "doxxing".',
    ];
    const item = {
      title: "Musk ragequits",
      description: sentences.join(" "),
    };
    it("should return the first sentence of the description", () => {
      expect(titleWithDescription({}, {}, item, {})).toEqual(
        [`${item.title} - ${sentences[0]}`, item.link].join("\n\n")
      );
    });
    it("should only return the title when the sentence isn't available for whatever reason", () => {
      expect(
        titleWithDescription({}, { options: { maxChars: 14 } }, item, {})
      ).toEqual([item.title, item.link].join("\n\n"));
    });
  });
});
