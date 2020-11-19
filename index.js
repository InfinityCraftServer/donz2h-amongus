const discord = require("discord.js");
const bot = new discord.Client();
const { table } = require('table')
const botConfig = require('./config.json')
bot.commands = new discord.Collection();

var messageChannel;
var waitingPlayers = [];
let waitingID;
var nicknameID = [];
var gaming;
var stopNicks;
var players;
var Game;
var ShortGame;
var voiceChat;

bot.on("ready", async () => {
    messageChannel = bot.channels.cache.get(botConfig.wachtruimtechat);
    voiceChat = bot.channels.cache.get(botConfig.gamechat)
    console.log(`${bot.user.username} is online and running!`);
    bot.user.setActivity("waiting room", { type: "WATCHING" });

    gaming = false;
    game = "Geen";
    stopNicks = false;
    waitingPlayers = [];
})
bot.on("message", async message => {

    if (message.author.bot) return;


    if (message.channel.type === "dm") return;

    var prefix = botConfig.prefix;
    if (!message.content.startsWith(prefix)) return;

    var messageArray = message.content.split(" ");

    var command = messageArray[0];
    var execute = command.substring(1)

    var arguments = messageArray.slice(1);

    if (execute == "help") {
        message.reply('```Commands:\n!startgame [PlayerCount] [Game] : Creëer een game sessie, dit activeert de wachtrij.\n!stopgame & !endgame : Stop de game sessie, Verwijdert de wachtlijst, en leegt deze in het geheugen van de bot.\n!changeplayers: verander get totaal aantal toegestane spelers in het live kanaal. (Tijdens het moven van members. Er word geen fysiek limiet ingesteld)\n!move: vult de gameroom met de mensen die het langste wachten.```\n***LET OP!*** Om deze commands uit te kunnen voeren moet je de permissie ADMINISTRATOR hebben \nVoor bugs en/of vragen, stuur een berichtje naar TheDarkIceKing#9445')
    }

    if (execute == "restart") {
        if (message.member.hasPermission('ADMINISTRATOR') || message.member.id == "478260337536139264") {
            message.reply("***De bot word opniew opgestart***")
            process.exit(1);
        } else{
            message.reply("Enkel users met de permissie ADMINISTRATOR en de developer kunnen de bot herstarten!")
        }
    }

    if (execute == "startgame") {
        if (!message.member.hasPermission('ADMINISTRATOR')) { return; }
        if (gaming == true) {
            message.delete()
            return;
        }
        if (!arguments[0] || !arguments[1]) {
            message.reply(botConfig.prefix + "startgame (playercount inc. host) (game)");
            return;
        }
        waitingPlayers.push(["Speler", "Gejoined tijd", "Game"])
        var Temp_game = arguments.slice(1).toString()
        var Temp_game2 = Temp_game.replace(/,/g, " ")
        ShortGame = Temp_game2.slice(0, 20)

        players = parseInt(arguments[0]);
        FullGame = Temp_game2;

        stopNicks = true;
        gaming = true;
        message.reply(`***Waiting room opgestart. Game: ${FullGame}. Spelers: ${players}***`)
        getWaitingroom();
    }

    if (execute == "stopgame" || execute == "endgame") {
        if (!message.member.hasPermission('ADMINISTRATOR')) { return; }
        if (gaming == false) {
            message.delete()
            return;
        }
        player = 0
        gaming = false;
        messageChannel.messages.fetch(waitingID)
            .then(msg => {
                msg.delete()
                waitingPlayers = [];
                nicknameID = [];
            });
        message.reply("***Game beëindigd, Wachtruimte data is verwijderd***")
    }
    if (execute == "changeplayers") {
        if (!message.member.hasPermission('ADMINISTRATOR')) { return; }
        if (gaming == false) { return; }
        if (parseInt(arguments[0])) {
            players = parseInt(arguments[0])
            editembed("```" + waitingTable + "```")
            message.reply(`***Aanstal spelers veranderd naar: ${players}***`)
        } else {
            message.reply(`!changeplayers [spelers]`)
        }
    }
    if (execute == "changegame") {
        if (!message.member.hasPermission('ADMINISTRATOR')) { return; }
        if (gaming == false) { return; }
        if (arguments[0]) {
            FullGame = arguments.toString().replace(/,/g, " ")
            console.log(FullGame)
            ShortGame = FullGame.slice(0, 20)
            console.log(ShortGame)
            editembed("```" + waitingTable + "```")
            message.reply(message.reply(`***Game veranderd naar: ${FullGame}***`))
            return;
        } else {
            console.log("hi")
            message.reply("!changegame [naam]")
        }
    }
    if (execute == "move") {
        if (!message.member.hasPermission('ADMINISTRATOR')) { return; }
        if (gaming == false) { return; }
        message.reply("***Moving players***")
        var amountMoves = players - voiceChat.members.size;

        for (i = 0; i < amountMoves; i++) {
            if (nicknameID[i] == null) {
                break;
            }

            var movedID = nicknameID[i][0];
            var moveUser = message.guild.members.cache.get(movedID)
            moveUser.voice.setChannel(botConfig.gamechat)
        }
    }

})

bot.on('voiceStateUpdate', async (oldMember, newMember) => {
    if (oldMember.mute != newMember.mute) { return; }
    if (oldMember.deaf != newMember.deaf) { return; }
    if (gaming == false) { return; }
    let newUserChannel = newMember.channelID
    var TemplistName = newMember.member.nickname;
    var listName;

    if (newMember.member.nickname == undefined) {
        listName = newMember.member.user.username
    } else {
        listName = TemplistName.slice(0, 17)
    }
    if (newUserChannel == botConfig.wachtruimte) {
        waitingPlayers.push([listName, await getTime(), ShortGame])
        nicknameID.push([newMember.member.user.id, listName])

    } else if (newUserChannel != botConfig.wachtruimte) {
        //left vc

        for (var i = 0; i < nicknameID.length; i++) {
            if (nicknameID[i][0] == newMember.id) {
                for (var j = 0; j < waitingPlayers.length; j++) {

                    if (waitingPlayers[j][0] == nicknameID[i][1]) {
                        nicknameID.splice(i, 1)
                        waitingPlayers.splice(j, 1)
                    }
                }
            }
        }
    }
    waitingTable = table(waitingPlayers);
    editembed("```" + waitingTable + "```")
});
async function getWaitingroom() {
    var listName;


    if (gaming == false) { return; }

    time = await getTime();
    var channel = bot.channels.cache.get(botConfig.wachtruimte)

    channel.members.forEach(player => {
        var TemplistName = player.nickname;
        if (player.nickname == undefined) {
            listName = player.user.username
        }
        else {
            listName = TemplistName.slice(0, 17)
        }
        waitingPlayers.push([listName, time, ShortGame])
        nicknameID.push([player.id, listName])
    });

    waitingTable = table(waitingPlayers);
    createEmbed("```" + waitingTable + "```")

}

async function getTime() {
    var today = new Date();
    var time = (("0" + today.getHours()).slice(-2)) + ":" + (("0" + today.getMinutes()).slice(-2)) + ":" + (("0" + today.getSeconds()).slice(-2));
    return time
}

async function buildembed(string) {

    var WaitEmbed = new discord.MessageEmbed()
        .setTitle("***Wachtruimte***")
        .setColor("7DE5E3")
        // .setThumbnail('https://cdn.discordapp.com/icons/629572447644942376/a_0589a38a4c4b8198398ea97c9a6f7cf8.gif?size=128')
        .addField("***Huidige game***", "*" + FullGame + "*")
        .addField("Max players:", players)
        .addField("Mensen in de wachtrij:", waitingPlayers.length - 1)
        .addField("\u200b", string)
        .setFooter("Developed door: TheDarkIceKing#9445")
        .setTimestamp()

    return WaitEmbed;
}

async function createEmbed(string) {

    var WaitEmbed = await buildembed(string)

    messageChannel.send(WaitEmbed).then(
        message => {
            waitingID = message.id;
        }
    )
}

async function editembed(string) {

    var WaitEmbed = await buildembed(string)

    messageChannel.messages.fetch(waitingID)
        .then(msg => {
            msg.edit(WaitEmbed)
        });
}

bot.login(process.env.TOKEN);