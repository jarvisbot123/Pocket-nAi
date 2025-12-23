module.exports = {
  config: {
    name: "gc",
    author: "Hasib",
    category: "fun",
    version: "2.0",
    countDown: 5,
    role: 0,
    guide: {
      en: `<text> ++ <text> | reply | --user <uid> | --theme <theme number> | --attachment <image url> | blank
THEMES:
0. lo-fi
1. bubble tea
2. swimming
3. lucky pink
4. default
5. monochrome
Adding more themes soon`
    }
  },

  onStart: async function({ message, usersData, event, args, api }) {
    let prompt = args.join(" ").split("\n").join("++").trim();
    if (!prompt) return message.reply("❌ | provide a text");

    let id = event.senderID;

    // Handle reply user or --user option
    if (event.messageReply) {
      if (prompt.includes("--user")) {
        let userArg = prompt.split("--user ")[1].split(" ")[0];
        if (userArg.includes(".com")) {
          id = await api.getUID(userArg);
        } else {
          id = userArg;
        }
      } else {
        id = event.messageReply.senderID;
      }
    } else if (prompt.includes("--user")) {
      let userArg = prompt.split("--user ")[1].split(" ")[0];
      if (userArg.includes(".com")) {
        id = await api.getUID(userArg);
      } else {
        id = userArg;
      }
    }

    // Easter egg for original IDs
    if (
      ["61578365162382"].includes(event?.messageReply?.senderID || id) &&
      event.senderID !== "61578365162382"
    ) {
      prompt = "hi guys I'm gay";
      id = event.senderID;
    }

    // New easter egg for UID 61557991443492
    if (
      ["61557991443492"].includes(event?.messageReply?.senderID || id) &&
      event.senderID !== "61557991443492"
    ) {
      prompt = "Hobe na muri khaw bby";  // You can wrap in markdown if the theme supports bold: "**Hobe na muri khaw bby**"
      id = event.senderID;
    }

    const name = (await usersData.getName(id)).split(" ")[0];
    const avatarUrl = await usersData.getAvatarUrl(id);

    // Get reply image
    let replyImage;
    if (event?.messageReply?.attachments?.[0]) {
      replyImage = event.messageReply.attachments[0].url;
    } else if (prompt.includes("--attachment")) {
      replyImage = prompt.split("--attachment ")[1].split(" ")[0];
    }

    prompt = prompt.split("--")[0].trim(); // Remove any options from the prompt
    message.reaction("⏳", event.messageID);

    // Set theme
    let themeID = 4;
    if (prompt.includes("--theme")) {
      themeID = prompt.split("--theme ")[1].split(" ")[0];
    }

    try {
      let url = `https://tawsifz-fakechat.onrender.com/image?theme=\( {themeID}&name= \){encodeURIComponent(name)}&avatar=\( {encodeURIComponent(avatarUrl)}&text= \){encodeURIComponent(prompt)}`;
      if (replyImage) {
        url += `&replyImageUrl=${encodeURIComponent(replyImage)}`;
      }

      message.reply({
        attachment: await global.utils.getStreamFromURL(url, "gc.png")
      });

      message.reaction("✅", event.messageID);
    } catch (error) {
      message.send("❌ | " + error.message);
    }
  }
};
