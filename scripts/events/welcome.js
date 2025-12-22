const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "1.7",
		author: "Hasib",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			welcomeMessage: "Cảm ơn bạn đã mời tôi vào nhóm!\nPrefix bot: %1\nĐể xem danh sách lệnh hãy nhập: %1help",
			multiple1: "bạn",
			multiple2: "các bạn",
			defaultWelcomeMessage: "Xin chào {userName}.\nChào mừng bạn đến với {boxName}.\nChúc bạn có buổi {session} vui vẻ!"
		},
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			welcomeMessage: "Thank you for inviting me to the group!\nBot prefix: %1\nTo view the list of commands, please enter: %1help",
			multiple1: "you",
			multiple2: "you guys",
			defaultWelcomeMessage: `🌙✨ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ✨🌙

𝐀𝐬𝐬𝐚𝐥𝐚𝐦𝐮𝐚𝐥𝐚𝐢𝐤𝐮𝐦 {userName} 🐼

𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 𝐭𝐡𝐞 𝐜𝐡𝐚𝐭 𝐠𝐫𝐨𝐮𝐩: {boxName} 🏡

𝐘𝐨𝐮 𝐚𝐫𝐞 𝐭𝐡𝐞 {memberCount}𝐭𝐡 𝐦𝐞𝐦𝐛𝐞𝐫 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩 𝐚𝐧𝐝 𝐚𝐝𝐝𝐞𝐝 𝐛𝐲 {addedBy} 💌

𝐇𝐚𝐯𝐞 𝐚 𝐧𝐢𝐜𝐞 {session} ☕`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const hours = getTime("HH");
				const { threadID } = event;
				const { nickNameBot } = global.GoatBot.config;
				const prefix = global.utils.getPrefix(threadID);
				const dataAddedParticipants = event.logMessageData.addedParticipants;

				// if new member is bot
				if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
					if (nickNameBot)
						api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
					return message.send(getLang("welcomeMessage", prefix));
				}

				// if new member:
				if (!global.temp.welcomeEvent[threadID])
					global.temp.welcomeEvent[threadID] = {
						joinTimeout: null,
						dataAddedParticipants: []
					};

				// push new member to array
				global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);

				// clear previous timeout
				clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

				// set new timeout
				global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
					const threadData = await threadsData.get(threadID);
					if (threadData.settings.sendWelcomeMessage == false)
						return;

					const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
					const dataBanned = threadData.data.banned_ban || [];
					const threadName = threadData.threadName || "this group";
					const memberCount = threadData.participantIDs.length;

					const userName = [],
						mentions = [];
					let multiple = false;

					if (dataAddedParticipants.length > 1)
						multiple = true;

					for (const user of dataAddedParticipants) {
						if (dataBanned.some((item) => item.id == user.userFbId))
							continue;
						userName.push(user.fullName);
						mentions.push({
							tag: user.fullName,
							id: user.userFbId
						});
					}

					if (userName.length == 0) return;

					// Get who added (first one, fallback if not available)
					const addedBy = dataAddedParticipants[0]?.addedBy?.fullName || "a kind friend";

					let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;

					const session = hours <= 10
						? getLang("session1")
						: hours <= 12
							? getLang("session2")
							: hours <= 18
								? getLang("session3")
								: getLang("session4");

					const form = {
						body: welcomeMessage
							.replace(/\{userName\}|\{userNameTag\}/g, userName.join(" & "))
							.replace(/\{boxName\}|\{threadName\}/g, threadName)
							.replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
							.replace(/\{session\}/g, session)
							.replace(/\{memberCount\}/g, memberCount)
							.replace(/\{addedBy\}/g, addedBy),
						mentions: welcomeMessage.match(/\{userNameTag\}/g) ? mentions : mentions // keep mentions for names
					};

					// === GIF System Added ===
					try {
						const gifUrl = "https://media.tenor.com/41WpfVPomtAAAAAM/hihi.gif"; // Cute waving panda 🐼
						const gifPath = path.join(__dirname, "cache", "welcome_panda.gif");

						await fs.ensureDir(path.join(__dirname, "cache"));
						const { data } = await axios.get(gifUrl, { responseType: "arraybuffer" });
						await fs.writeFile(gifPath, Buffer.from(data));

						form.attachment = fs.createReadStream(gifPath);

						await message.send(form);

						await fs.unlink(gifPath); // clean up
					} catch (err) {
						console.error("Failed to add welcome GIF:", err);
						// If GIF fails, send text only
						await message.send(form);
					}
					// === End GIF System ===

					// Original custom attachments (if any)
					if (threadData.data.welcomeAttachment) {
						const files = threadData.data.welcomeAttachment;
						const attachments = files.reduce((acc, file) => {
							acc.push(drive.getFile(file, "stream"));
							return acc;
						}, []);
						const extraAttachments = (await Promise.allSettled(attachments))
							.filter(({ status }) => status == "fulfilled")
							.map(({ value }) => value);
						if (extraAttachments.length > 0) {
							await message.send({ attachment: extraAttachments }, threadID);
						}
					}

					delete global.temp.welcomeEvent[threadID];
				}, 1500);
			};
	}
};
