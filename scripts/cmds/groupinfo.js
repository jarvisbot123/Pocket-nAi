const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "groupinfo",
    aliases: ["boxinfo"],
    version: "1.8",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "Group information",
    longDescription: "Clean & minimal group info (Admin & Owner only)",
    category: "box chat",
    guide: {
      en: "{p}groupinfo"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);

      // Bot owners
      const owners = ["100060606189407", "61557991443492"];
      const senderID = event.senderID;

      const isAdmin = threadInfo.adminIDs.some(ad => ad.id === senderID);
      const isOwner = owners.includes(senderID);

      if (!isAdmin && !isOwner) {
        return api.sendMessage(
          "Only group admins or bot owners can use this command.",
          event.threadID,
          event.messageID
        );
      }

      // Members
      const totalMembers = threadInfo.participantIDs.length;
      let male = 0, female = 0, other = 0;

      for (const user of threadInfo.userInfo) {
        if (user.gender === "MALE") male++;
        else if (user.gender === "FEMALE") female++;
        else other++;
      }

      // Admin list
      let adminList = "";
      for (const ad of threadInfo.adminIDs) {
        const info = await api.getUserInfo(ad.id);
        adminList += `• ${info[ad.id]?.name || "Unknown"}\n`;
      }

      // Estimated creator
      let creatorName = "Unknown";
      if (threadInfo.adminIDs.length > 0) {
        const creatorID = threadInfo.adminIDs[0].id;
        const creatorInfo = await api.getUserInfo(creatorID);
        creatorName = creatorInfo[creatorID]?.name || "Unknown";
      }

      const groupName = (threadInfo.threadName || "Unnamed Group").toUpperCase();

      const text =
`━━━━━━━━━━━━━━━━━━━━
         ${groupName}
━━━━━━━━━━━━━━━━━━━━
      𖣘︎𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡𖣘︎
ID          : ${threadInfo.threadID}
Creator     : ${creatorName}
Approval    : ${threadInfo.approvalMode ? "ON" : "OFF"}
Emoji       : ${threadInfo.emoji || "-"}

Members
───────
Total       : ${totalMembers}
Male        : ${male}
Female      : ${female}
Other       : ${other}

Admins (${threadInfo.adminIDs.length})
──────────
${adminList}
Activity
────────
Messages    : ${threadInfo.messageCount || "N/A"}

━━━━━━━━━━━━━━━━━━━━
Made by ${this.config.author}`;

      const send = (attachment = null) => {
        api.sendMessage(
          { body: text, attachment },
          event.threadID,
          attachment ? () => fs.unlinkSync(__dirname + "/cache/group.png") : null,
          event.messageID
        );
      };

      // Group image
      if (threadInfo.imageSrc) {
        request(encodeURI(threadInfo.imageSrc))
          .pipe(fs.createWriteStream(__dirname + "/cache/group.png"))
          .on("close", () =>
            send(fs.createReadStream(__dirname + "/cache/group.png"))
          );
      } else {
        send();
      }

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "Failed to get group information.",
        event.threadID,
        event.messageID
      );
    }
  }
};
