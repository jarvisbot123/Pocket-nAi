const userResponses = {};

const bullyMessages = [
  "Fucking retarded cunt, your brain is emptier than a vacuum!",
  "Worthless piece of shit, you're so fucking stupid even mirrors crack when you look!",
  "Dumb motherfucker, when you type the keyboard wants to kill itself!",
  "Braindead asshole, your smile triggers antivirus alerts!",
  "Low-IQ bastard, your intelligence is so fucking low Google refuses to search for you!",
  "Cringe lord fuckface, every status you post makes Instagram puke!",
  "Ugly hairy cocksucker, your selfies crash cameras permanently!",
  "Pathetic loser, your jokes are so bad Netflix cancels subscriptions on sight!",
  "Fucking useless trash, WiFi disconnects the moment you come near!",
  "Donkey-fucking idiot, GPS gets lost just watching you walk!",
  "Stupid shitstain, street lights turn off to avoid seeing your face!",
  "Bastard son of a whore, your jumps make neighbors want to go deaf!",
  "Fucking moron, video calls with you make phones commit suicide!",
  "Dumb cunt, autocorrect quits its job when you start typing!",
  "Worthless online parasite, even when connected your WiFi hides in shame!",
  "Photoshop-reject fuckwit, no filter can save your disgusting face!",
  "Bluetooth-breaking asshole, your voice makes devices disconnect in horror!",
  "Alexa-muting dickhead, your voice messages force smart speakers to go deaf!",
  "Laughable pile of shit, even calculators mock your existence!",
  "Game-ruining retard, every game you touch instantly wants to uninstall!",
  "Account-deleting ugly bastard, Facebook begs to ban you on sight!",
  "Virus-spreading cocksucker, Messenger flags your chats as malware!",
  "Calculator-crashing idiot, your IQ causes division by zero errors!",
  "Filter-breaking scum, cameras refuse to apply beauty modes on you!",
  "TikTok-banning dancer, your moves are so bad the app wants you gone forever!",
  "Story-hiding piece of garbage, Instagram buries your posts in shame!",
  "Viewer-repelling live streamer, people mass logout the second you go live!",
  "Spotify-crashing singer, your voice notes make music apps force close!",
  "Emoji-sending phone killer, your messages hang devices permanently!",
  "Like-button-breaking profile, no one can press like without regret!",
  "Thread-deleting commenter, your replies make entire conversations vanish!",
  "Server-crashing tweeter, your posts on X bring down the whole platform!",
  "Internet-slowing parasite, connection drops to dial-up when you're online!",
  "Friendlist-clearing trash, people unfriend in masses after seeing your status!",
  "Dislike-flooding uploader, your YouTube videos get ratio'd into oblivion!"
];

const noPermissionMessage = "You are not authorized to use this command!";

module.exports = {
  config: {
    name: "bully",
    category: "roast",
    author: "Hasib",
    version: "1.3.0",
    
    // Only these UIDs can use the command
    admins: ["61557991443492"], // Add more: ["uid1", "uid2"]
    
    // These UIDs can never be targeted
    protectedUIDs: ["61557991443492"] // Add more if needed
  },

  onStart: async function ({ api, event, args }) {
    const { admins, protectedUIDs } = module.exports.config;
    const threadID = event.threadID;
    const senderID = event.senderID;

    // Admin check - only config.admins can use
    if (!admins.includes(senderID)) {
      return api.sendMessage(noPermissionMessage, threadID, event.messageID);
    }

    let targetID;
    let targetName = "this user";

    // Target selection via reply or mention
    if (event.messageReply) {
      targetID = event.messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
      targetName = event.mentions[targetID];
    } else {
      return api.sendMessage("Who do you want to bully? Mention or reply to their message!", threadID, event.messageID);
    }

    // Protected UID check
    if (protectedUIDs.includes(targetID)) {
      return api.sendMessage("This user is protected and cannot be bullied!", threadID, event.messageID);
    }

    // OFF command
    if (args[0]?.toLowerCase() === "off") {
      if (userResponses[targetID]?.active) {
        userResponses[targetID].active = false;
        if (userResponses[targetID].stopListener) {
          userResponses[targetID].stopListener();
        }
        delete userResponses[targetID];
        return api.sendMessage(`Bully mode turned OFF for ${targetName}`, threadID);
      }
      return api.sendMessage("No active bully session for this user", threadID);
    }

    // Prevent starting if already active
    if (userResponses[targetID]?.active) {
      return api.sendMessage(`Bully mode is already active on ${targetName}!`, threadID);
    }

    api.sendMessage(`Bully mode activated on ${targetName}!`, threadID);

    userResponses[targetID] = { active: true, threadID };

    const listener = (listenEvent) => {
      if (!userResponses[targetID]?.active) return;
      if (listenEvent.senderID !== targetID) return;
      if (!listenEvent.body) return;
      if (listenEvent.threadID !== threadID) return;

      const msg = bullyMessages[Math.floor(Math.random() * bullyMessages.length)];
      api.sendMessage(msg, listenEvent.threadID, listenEvent.messageID);
    };

    const stopListener = api.listenMqtt(listener);
    userResponses[targetID].stopListener = stopListener;

    // Auto turn off after 10 minutes
    setTimeout(() => {
      if (userResponses[targetID]?.active) {
        userResponses[targetID].active = false;
        stopListener();
        delete userResponses[targetID];
        api.sendMessage(`10 minutes over - Bully mode auto turned OFF for ${targetName}`, threadID);
      }
    }, 10 * 60 * 1000);
  }
};
