const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome",
    version: "4.0",
    author: "Hasib",
    category: "events"
  },

  onStart: async ({ api, event, threadsData }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const addedParticipants = logMessageData.addedParticipants;

    // Ignore if bot is added
    if (addedParticipants.some(u => u.userFbId == api.getCurrentUserID())) return;

    try {
      // 🌙 Automatic time greeting
      const hour = new Date().getHours();
      let timeGreeting;

      if (hour >= 4 && hour < 6) {
        timeGreeting = "𝐝𝐚𝐰𝐧 🌄";
      } else if (hour >= 6 && hour < 12) {
        timeGreeting = "𝐦𝐨𝐫𝐧𝐢𝐧𝐠 🌅";
      } else if (hour >= 12 && hour < 16) {
        timeGreeting = "𝐚𝐟𝐭𝐞𝐫𝐧𝐨𝐨𝐧 ☀️";
      } else if (hour >= 16 && hour < 19) {
        timeGreeting = "𝐞𝐯𝐞𝐧𝐢𝐧𝐠 🌆";
      } else {
        timeGreeting = "𝐧𝐢𝐠𝐡𝐭 🌙";
      }

      // 🎞️ Welcome GIF
      const gifUrl = "https://files.catbox.moe/e3l5s6.gif";
      const cacheDir = path.join(__dirname, "cache");
      const gifPath = path.join(cacheDir, "welcome.gif");

      await fs.ensureDir(cacheDir);
      const res = await axios.get(gifUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(gifPath, Buffer.from(res.data));

      // 👥 Mentions
      const mentions = [];
      const names = addedParticipants.map(p => {
        mentions.push({ tag: p.fullName, id: p.userFbId });
        return p.fullName;
      });

      // 📊 Thread info
      const threadData = await threadsData.get(threadID);
      const threadName = threadData.threadName || "Group";
      const memberCount = threadData.participantIDs.length;

      // ❤️ Added by
      const addedBy = addedParticipants[0]?.addedBy?.fullName || "Someone";

      // ✨ FINAL WELCOME MESSAGE ✨
      const welcomeText = `🌙✨ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ✨🌙
𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮𝐚𝐥𝐚𝐢𝐤𝐮𝐦 ${names.join(", ")} 🐼
𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 𝐭𝐡𝐞 𝐜𝐡𝐚𝐭 𝐠𝐫𝐨𝐮𝐩: ${threadName} 🏡
𝐘𝐨𝐮 𝐚𝐫𝐞 𝐭𝐡𝐞 ${memberCount}𝐭𝐡 𝐦𝐞𝐦𝐛𝐞𝐫 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩 𝐚𝐧𝐝 𝐚𝐝𝐝𝐞𝐝 𝐛𝐲 ${addedBy} 💌
𝐇𝐚𝐯𝐞 𝐚 𝐧𝐢𝐜𝐞 ${timeGreeting}`;

      // 📩 Send message
      await api.sendMessage(
        {
          body: welcomeText,
          mentions,
          attachment: fs.createReadStream(gifPath)
        },
        threadID
      );

      // 🧹 Clean cache
      fs.unlinkSync(gifPath);

    } catch (err) {
      console.error("❌ Welcome error:", err);
    }
  }
};
