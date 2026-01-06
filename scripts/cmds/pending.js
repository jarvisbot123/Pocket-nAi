module.exports = {
  config: {
    name: "pending",
    aliases: ["pen"],
    version: "1.1",
    author: "𝐇𝐚𝐬𝐢𝐛",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "View and manage pending group approvals"
    },
    longDescription: {
      en: "Shows pending groups. Reply with numbers to approve or `c + numbers` to cancel."
    },
    category: "Admin"
  },

  langs: {
    en: {
      invaildNumber: "%1 is not a valid number",
      cancelSuccess: "❌ Refused %1 thread(s)!",
      approveSuccess: "✅ Approved %1 thread(s)!",
      cantGetPendingList: "⚠️ Can't get the pending list!",
      returnListPending: "»「PENDING」«❮ %1 thread(s) waiting ❯\n\n%2",
      returnListClean: "「PENDING」 No pending threads found."
    }
  },

  onReply: async function ({ api, event, Reply, getLang }) {
    if (event.senderID != Reply.author) return;

    const { body, threadID, messageID } = event;
    let count = 0;
    const input = body.trim().toLowerCase();

    // ❌ CANCEL MODE
    if (input.startsWith("c")) {
      const index = body.slice(1).trim().split(/\s+/);

      for (const i of index) {
        if (isNaN(i) || i <= 0 || i > Reply.pending.length)
          return api.sendMessage(getLang("invaildNumber", i), threadID, messageID);

        await api.removeUserFromGroup(
          api.getCurrentUserID(),
          Reply.pending[i - 1].threadID
        );
        count++;
      }
      return api.sendMessage(getLang("cancelSuccess", count), threadID, messageID);
    }

    // ✅ APPROVE MODE
    const index = body.split(/\s+/);
    for (const i of index) {
      if (isNaN(i) || i <= 0 || i > Reply.pending.length)
        return api.sendMessage(getLang("invaildNumber", i), threadID, messageID);

      const targetThread = Reply.pending[i - 1].threadID;

      try {
        await api.addUserToGroup(api.getCurrentUserID(), targetThread);
        const info = await api.getThreadInfo(targetThread);

        api.sendMessage(
`╔═══✦〘 𝐇𝐈𝐍𝐀𝐓𝐀 𝐒𝐀𝐍𝐀 〙✦═══╗
┃ 🏷️ Name: ${info.threadName || "Unnamed"}
┃ 🆔 Group ID: ${targetThread}
┃ 👥 Members: ${info.participantIDs.length}
┃ 🔒 Approval: ${info.approvalMode ? "On" : "Off"}
┃ ⏰ Joined: ${new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}
┃ ✅ Status: Active
╚════════════════════╝`,
          targetThread
        );

        count++;
      } catch (e) {
        console.log(e);
      }
    }

    return api.sendMessage(getLang("approveSuccess", count), threadID, messageID);
  },

  onStart: async function ({ api, event, getLang, commandName }) {
    const { threadID, messageID } = event;
    let msg = "";
    let index = 1;

    try {
      const pending = await api.getThreadList(100, null, ["PENDING"]) || [];
      const list = pending.filter(t => t.isSubscribed && t.isGroup);

      for (const item of list) {
        msg += `${index++}. ${item.name || "Unnamed Group"} (${item.threadID})\n`;
      }

      if (!list.length)
        return api.sendMessage(getLang("returnListClean"), threadID, messageID);

      return api.sendMessage(
        getLang("returnListPending", list.length, msg),
        threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            author: event.senderID,
            pending: list
          });
        },
        messageID
      );
    } catch (e) {
      console.error(e);
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }
  }
};
