const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

// --- Owner setup ---
const OWNER_ID = "61557991443492"; // Owner UID
const OWNER_DISPLAY_NAME = "🅺🅰🆁🅸🅼 🅱🅴🅽🆉🅸🅼🅰"; // Always manually set

module.exports = {
    config: {
        name: "admin",
        aliases: ["a", "ar"], // owner commands
        version: "2.5",
        author: "Hasib",
        countDown: 5,
        role: 0,
        shortDescription: { en: "Manage bot admins" },
        longDescription: { en: "Add, remove or view bot admins" },
        category: "admin",
        guide: {
            en: `{pn} a list             → Show admin list (everyone can use)
{pn} a add <uid|@tag>    → Add admin role (Owner only)
{pn} a remove|rm <uid|@tag> → Remove admin role (Owner only)
Reply to a user + {pn} a add/remove → Add/remove admin (Owner only)`
        }
    },

    langs: {
        en: {
            listAdmin:
`🎭 𝗢𝗪𝗡𝗘𝗥 & 𝗔𝗗𝗠𝗜𝗡 🎭
♦___________________♦
♕︎ 𝑶𝑾𝑵𝑬𝑹 ♕︎: ✨ ${OWNER_DISPLAY_NAME} ✨
_____________________________
_____♔︎ 𝑨𝑫𝑴𝑰𝑵'𝑺 ♔︎_____
%1
_____________________________
🤖 𝑩𝑶𝑻 ♔︎: ✨|︵✰[_🪽°Hinata Sana°🐰_]࿐|✨
♔︎ 𝑂𝑊𝐸𝑅 ♔: https://www.facebook.com/karim.benzima.246709
⚠️ Note:type !help to see all available commands.,
            added: "✅ | Added admin role for %1 users:\n%2",
            alreadyAdmin: "⚠️ | %1 users already have admin role:\n%2",
            missingIdAdd: "⚠️ | Please provide an ID, mention a user, or reply to a message to add admin",
            removed: "✅ | Removed admin role from %1 users:\n%2",
            notAdmin: "⚠️ | %1 users do not have admin role:\n%2",
            missingIdRemove: "⚠️ | Please provide an ID, mention a user, or reply to a message to remove admin",
            notAllowed: "This Command does not exist, type !help to see all available commands"
    },

    onStart: async function ({ message, args, usersData, event, getLang }) {
        const senderID = event.senderID;
        let cmd = args[0]?.toLowerCase();

        // Map aliases for commands
        if (cmd === "ar" || cmd === "rm" || cmd === "r") cmd = "remove";
        if (cmd === "a" && args[1]?.toLowerCase() === "add") cmd = "add";
        if (cmd === "a" && args[1]?.toLowerCase() === "remove") cmd = "remove";
        if (cmd === "a") cmd = "list"; // "a" defaults to list if no second arg

        // --- LIST ADMINS (Everyone can use) ---
        if (cmd === "list") {
            const dynamicAdmins = config.adminBot.filter(uid => uid !== OWNER_ID);
            let adminNames = [];

            for (const uid of dynamicAdmins) {
                const name = await usersData.getName(uid);
                adminNames.push(`• ${name}`);
            }

            if (adminNames.length === 0) adminNames.push("• No admins");

            return message.reply(getLang("listAdmin", adminNames.join("\n")));
        }

        // --- ADD / REMOVE ADMINS (Owner only) ---
        if (cmd === "add" || cmd === "remove") {
            if (senderID !== OWNER_ID) return message.reply(getLang("notAllowed"));

            let uids = [];
            if (Object.keys(event.mentions).length > 0)
                uids = Object.keys(event.mentions);
            else if (event.type === "message_reply")
                uids.push(event.messageReply.senderID);
            else
                uids = args.slice(2).filter(arg => !isNaN(arg)); // shift index for second arg

            if (uids.length === 0)
                return message.reply(cmd === "add" ? getLang("missingIdAdd") : getLang("missingIdRemove"));

            if (cmd === "add") {
                const newAdmins = [], alreadyAdmins = [];
                for (const uid of uids) {
                    if (config.adminBot.includes(uid) || uid === OWNER_ID)
                        alreadyAdmins.push(uid);
                    else newAdmins.push(uid);
                }

                config.adminBot.push(...newAdmins);
                writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

                const newAdminNames = await Promise.all(newAdmins.map(uid => usersData.getName(uid)));
                const alreadyAdminNames = await Promise.all(alreadyAdmins.map(uid => usersData.getName(uid)));

                return message.reply(
                    (newAdmins.length > 0 ? getLang("added", newAdmins.length, newAdminNames.map(n => `• ${n}`).join("\n")) + "\n" : "") +
                    (alreadyAdmins.length > 0 ? getLang("alreadyAdmin", alreadyAdmins.length, alreadyAdminNames.map(n => `• ${n}`).join("\n")) : "")
                );
            }

            if (cmd === "remove") {
                const removedAdmins = [], notAdmins = [];
                for (const uid of uids) {
                    if (uid === OWNER_ID) continue; // protect owner
                    if (config.adminBot.includes(uid)) {
                        removedAdmins.push(uid);
                        config.adminBot.splice(config.adminBot.indexOf(uid), 1);
                    } else notAdmins.push(uid);
                }

                writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

                const removedAdminNames = await Promise.all(removedAdmins.map(uid => usersData.getName(uid)));
                const notAdminNames = await Promise.all(notAdmins.map(uid => usersData.getName(uid)));

                return message.reply(
                    (removedAdmins.length > 0 ? getLang("removed", removedAdmins.length, removedAdminNames.map(n => `• ${n}`).join("\n")) + "\n" : "") +
                    (notAdmins.length > 0 ? getLang("notAdmin", notAdmins.length, notAdminNames.map(n => `• ${n}`).join("\n")) : "")
                );
            }
        }

        return message.reply("⚠️ | Invalid command! Use 'a list', 'a add', 'a remove'.");
    }
};
