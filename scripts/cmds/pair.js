const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const baseUrl =
  "https://raw.githubusercontent.com/Saim12678/Saim69/1a8068d7d28396dbecff28f422cb8bc9bf62d85f/font";

// fallback image if profile picture is locked/unavailable
const FALLBACK_AVATAR = "https://i.imgur.com/6VBx3io.png";

module.exports = {
  config: {
    name: "pair",
    author: "Hasib",
    category: "love",
    version: "1.1",
    role: 0,
    shortDescription: {
      en: "💘 Generate a love match between you and another group member"
    },
    longDescription: {
      en: "Generates a love match image with circular avatars and compatibility percentage."
    },
    guide: {
      en: "{p}{n} — Use this command in a group"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      // ===== Sender =====
      const senderData = await usersData.get(event.senderID);
      let senderName = senderData?.name || "You";

      // ===== Thread users =====
      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo || [];
      const botID = api.getCurrentUserID();

      const myData = users.find(u => u.id === event.senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage(
          "⚠️ Could not determine your gender.",
          event.threadID,
          event.messageID
        );
      }

      // ===== Match logic =====
      let matchCandidates = [];
      if (myData.gender === "MALE") {
        matchCandidates = users.filter(
          u => u.gender === "FEMALE" && u.id !== event.senderID && u.id !== botID
        );
      } else if (myData.gender === "FEMALE") {
        matchCandidates = users.filter(
          u => u.gender === "MALE" && u.id !== event.senderID && u.id !== botID
        );
      }

      if (!matchCandidates.length) {
        return api.sendMessage(
          "❌ No suitable match found in the group.",
          event.threadID,
          event.messageID
        );
      }

      const selectedMatch =
        matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      let matchName = selectedMatch.name || "Unknown";

      // ===== Stylish font =====
      let fontMap = {};
      try {
        const { data } = await axios.get(`${baseUrl}/21.json`);
        fontMap = data;
      } catch {}

      const convertFont = text =>
        text.split("").map(ch => fontMap[ch] || ch).join("");

      senderName = convertFont(senderName);
      matchName = convertFont(matchName);

      // ===== Canvas =====
      const width = 735;
      const height = 411;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const background = await loadImage(
        "https://files.catbox.moe/g6lr9y.jpg"
      );
      ctx.drawImage(background, 0, 0, width, height);

      // ===== Load avatars (same as your first FB link) =====
      async function loadAvatar(uid) {
        try {
          return await loadImage(
            `https://graph.facebook.com/${uid}/picture?width=720&height=720`
          );
        } catch {
          return await loadImage(FALLBACK_AVATAR);
        }
      }

      const senderAvatar = await loadAvatar(event.senderID);
      const matchAvatar = await loadAvatar(selectedMatch.id);

      // ===== Draw circular avatars =====
      function drawCircle(img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      drawCircle(senderAvatar, 131, 128, 154);
      drawCircle(matchAvatar, width - 302, 128, 154);

      // ===== Save image =====
      const outputPath = path.join(__dirname, "pair_output.png");
      fs.writeFileSync(outputPath, canvas.toBuffer());

      // ===== Message =====
      const lovePercent = Math.floor(Math.random() * 31) + 70;

      const message = `💞 𝗠𝗮𝘁𝗰𝗵𝗺𝗮𝗸𝗶𝗻𝗴 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲 💞

🎀 ${senderName} ✨️
🎀 ${matchName} ✨️

🕊️ Destiny has written your names together 🌹  
May your bond last forever ✨️

💘 Compatibility: ${lovePercent}% 💘`;

      api.sendMessage(
        {
          body: message,
          attachment: fs.createReadStream(outputPath)
        },
        event.threadID,
        () => fs.unlinkSync(outputPath),
        event.messageID
      );
    } catch (error) {
      api.sendMessage(
        "❌ An error occurred: " + error.message,
        event.threadID,
        event.messageID
      );
    }
  }
};
