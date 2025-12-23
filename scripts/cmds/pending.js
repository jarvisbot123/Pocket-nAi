module.exports = {
  config: {
    name: "pending",
    aliases: ["pen"],              // Added shortcut
    version: "1.0",
    author: "𝐇𝐚𝐬𝐢𝐛",
    countDown: 5,
    role: 0,                        // Changed to 0 → everyone can use
    shortDescription: {
      vi: "",
      en: "View and manage pending group approvals"
    },
    longDescription: {
      vi: "",
      en: "Shows the list of groups pending approval. Reply with numbers to approve or 'c + numbers' to cancel."
    },
    category: "Admin"
  },

  langs: {
    en: {
      invaildNumber: "%1 is not a valid number",
      cancelSuccess: "Refused %1 thread(s)!",
      approveSuccess: "Approved successfully %1 thread(s)!",
      cantGetPendingList: "Can't get the pending list!",
      returnListPending: "»「PENDING」«❮ There are %1 thread(s) waiting for approval ❯\n\n%2",
      returnListClean: "「PENDING」There is no thread in the pending list currently."
    }
  },

  onReply: async function ({ api, event, Reply, getLang, commandName }) {
    if (String(event.senderID) !== String(Reply.author)) return;
    const { body, threadID, messageID } = event;
    let count = 0;

    // Cancel mode: starts with "c" or "cancel"
    if ((isNaN(body) && body.indexOf("c") == 0) || body.toLowerCase().indexOf("cancel") == 0) {
      const index = body.slice(1).trim().split(/\s+/);
      for (const i of index) {
        if (isNaN(i) || i <= 0 || i > Reply.pending.length)
          return api.sendMessage(getLang("invaildNumber", i), threadID, messageID);
        api.removeUserFromGroup(api.getCurrentUserID(), Reply.pending[i - 1].threadID);
        count++;
      }
      return api.sendMessage(getLang("cancelSuccess", count), threadID, messageID);
    } else {
      // Approve mode
      const index = body.split(/\s+/);
      for (const i of index) {
        if (isNaN(i) || i <= 0 || i > Reply.pending.length)
          return api.sendMessage(getLang("invaildNumber", i), threadID, messageID);

        const targetThread = Reply.pending[i - 1].threadID;
        const threadInfo = await api.getThreadInfo(targetThread);
        const groupName = threadInfo.threadName || "Unnamed Group";
        const memberCount = threadInfo.participantIDs.length;
        const time = new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' });

        api.sendMessage(
`╔═══✦〘︵✰[_🪽°𝐇𝐈𝐍𝐀𝐓𝐀 𝐒𝐀𝐍𝐀°🐼_]࿐𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳 〙✦═══╗
┃
┃ 🏷️ 𝙽𝚊𝚖𝚎: ${groupName}
┃ 🆔 𝙶𝚛𝚘𝚞𝚙 𝙸𝙳: ${targetThread}
┃ 👥 𝙼𝚎𝚖𝚋𝚎𝚛𝚜: ${memberCount}
┃ 🔒 𝙰𝚙𝚙𝚛𝚘𝚟𝚊𝚕 𝙼𝚘𝚍𝚎: ${threadInfo.approvalMode ? "On" : "Off"}
┃ 😊 𝙴𝚖𝚘𝚓𝚒: ${threadInfo.emoji || "None"}
┃ ⏰ 𝙹𝚘𝚒𝚗𝚎𝚍: ${time}
┃ ✅ 𝚂𝚝𝚊𝚝𝚞𝚜: Active
┃ 💡 𝚃𝚒𝚙: Type /help to see all commands!
╚════════════════════╝`, targetThread);

        count++;
      }
      return api.sendMessage(getLang("approveSuccess", count), threadID, messageID);
    }
  },

  onStart: async function ({ api, event, getLang, commandName }) {
    const { threadID, messageID } = event;
    let msg = "", index = 1;

    try {
      const spam = await api.getThreadList(100, null, ["OTHER"]) || [];
      const pending = await api.getThreadList(100, null, ["PENDING"]) || [];
      const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);

      for (const item of list) {
        msg += `\( {index++}/ \){item.name || "Unnamed Group"} (${item.threadID})\n`;
      }

      if (list.length !== 0) {
        const finalMsg = getLang("returnListPending", list.length, msg);
        return api.sendMessage(finalMsg, threadID, (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: event.senderID,
            pending: list
          });
        }, messageID);
      } else {
        return api.sendMessage(getLang("returnListClean"), threadID, messageID);
      }

    } catch (e) {
      console.error(e);
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }
  }
};
