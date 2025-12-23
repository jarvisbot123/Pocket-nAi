const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

const OWNER_UID = "61557991443492"; // Permanent VIP & VIP Manager

module.exports = {
  config: {
    name: "vip",
    version: "1.1",
    author: "Hasib",
    countDown: 5,
    role: 0,
    description: {
      vi: "Thêm, xóa, sửa quyền VIP",
      en: "Add, remove, edit VIP role"
    },
    category: "box chat",
    guide: {
      vi: '   {pn} [add | -a] <uid | @tag>: Thêm quyền VIP cho người dùng'
        + '\n   {pn} [remove | -r] <uid | @tag>: Xóa quyền VIP của người dùng'
        + '\n   {pn} [list | -l]: Liệt kê danh sách VIP',
      en: '   {pn} [add | -a] <uid | @tag>: Add VIP role for user'
        + '\n   {pn} [remove | -r] <uid | @tag>: Remove VIP role of user'
        + '\n   {pn} [list | -l]: List all VIP users'
    }
  },

  langs: {
    vi: {
      added: "✅ | Đã thêm quyền VIP cho %1 người dùng:\n%2",
      alreadyVip: "\n⚠️ | %1 người dùng đã có quyền VIP:\n%2",
      missingIdAdd: "⚠️ | Vui lòng nhập ID hoặc tag người dùng muốn thêm quyền VIP",
      removed: "✅ | Đã xóa quyền VIP của %1 người dùng:\n%2",
      notVip: "⚠️ | %1 người dùng không có quyền VIP:\n%2",
      missingIdRemove: "⚠️ | Vui lòng nhập ID hoặc tag người dùng muốn xóa quyền VIP",
      listVip: "💎 | Danh sách VIP:\n%1",
      noPermission: "⚠️ | Only owner can manage VIPs."
    },
    en: {
      added: "✅ | Added VIP role for %1 users:\n%2",
      alreadyVip: "\n⚠️ | %1 users already have VIP role:\n%2",
      missingIdAdd: "⚠️ | Please enter ID or tag user to add VIP role",
      removed: "✅ | Removed VIP role of %1 users:\n%2",
      notVip: "⚠️ | %1 users don't have VIP role:\n%2",
      missingIdRemove: "⚠️ | Please enter ID or tag user to remove VIP role",
      listVip: "💎 | List of VIPs:\n%1",
      noPermission: "⚠️ | Only owner can manage VIPs."
    }
  },

  onStart: async function ({ message, args, usersData, event, getLang }) {

    /* 🔒 FORCE OWNER ALWAYS VIP */
    if (!config.vipuser.includes(OWNER_UID)) {
      config.vipuser.push(OWNER_UID);
      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
    }

    switch (args[0]) {

      /* ➕ ADD VIP */
      case "add":
      case "-a": {

        if (event.senderID !== OWNER_UID)
          return message.reply(getLang("noPermission"));

        if (!args[1])
          return message.reply(getLang("missingIdAdd"));

        let uids = [];
        if (Object.keys(event.mentions).length > 0)
          uids = Object.keys(event.mentions);
        else if (event.messageReply)
          uids.push(event.messageReply.senderID);
        else
          uids = args.filter(arg => !isNaN(arg));

        const added = [];
        const already = [];

        for (const uid of uids) {
          if (config.vipuser.includes(uid))
            already.push(uid);
          else {
            config.vipuser.push(uid);
            added.push(uid);
          }
        }

        const getNames = async (ids) =>
          Promise.all(ids.map(uid =>
            usersData.getName(uid).then(name => `• ${name} (${uid})`)
          ));

        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

        return message.reply(
          (added.length ? getLang("added", added.length, (await getNames(added)).join("\n")) : "") +
          (already.length ? getLang("alreadyVip", already.length, already.join("\n")) : "")
        );
      }

      /* ➖ REMOVE VIP */
      case "remove":
      case "-r": {

        if (event.senderID !== OWNER_UID)
          return message.reply(getLang("noPermission"));

        if (!args[1])
          return message.reply(getLang("missingIdRemove"));

        let uids = [];
        if (Object.keys(event.mentions).length > 0)
          uids = Object.keys(event.mentions);
        else
          uids = args.filter(arg => !isNaN(arg));

        const removed = [];
        const notVip = [];

        for (const uid of uids) {
          if (uid === OWNER_UID) continue; // Cannot remove owner
          if (config.vipuser.includes(uid)) {
            config.vipuser.splice(config.vipuser.indexOf(uid), 1);
            removed.push(uid);
          } else {
            notVip.push(uid);
          }
        }

        const getNames = async (ids) =>
          Promise.all(ids.map(uid =>
            usersData.getName(uid).then(name => `• ${name} (${uid})`)
          ));

        writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

        return message.reply(
          (removed.length ? getLang("removed", removed.length, (await getNames(removed)).join("\n")) : "") +
          (notVip.length ? getLang("notVip", notVip.length, notVip.join("\n")) : "")
        );
      }

      /* 📜 VIP LIST */
      case "list":
      case "-l": {

        if (config.vipuser.length === 0)
          return message.reply("⚠️ | No VIP users found");

        const list = await Promise.all(
          config.vipuser.map(uid =>
            usersData.getName(uid).then(name => `• ${name} (${uid})`)
          )
        );

        return message.reply(getLang("listVip", list.join("\n")));
      }

      default:
        return message.SyntaxError();
    }
  }
};
