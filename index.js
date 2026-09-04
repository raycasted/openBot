// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, EmbedBuilder, ActivityType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { token, aiKey, guildId, mongoURI, countingChannelId, logsChannelId, confessionsChannelId, levelRoles, dbName, aiPrompt, defaultStatus } = require('./config.json');
const { MongoClient } = require('mongodb');
const { randomInt } = require('node:crypto');
const { GoogleGenAI } = require("@google/genai");
let nextCount = 1;
let autoCount = false;
let lastUserCountId = 0;
const xpCooldown = new Map();
const aiCooldown = new Map();
const xpCooldownTime = 60 * 1000; // 60 seconds in ms
const aiCooldownTime = 15 * 1000; // 15 seconds in ms
// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const ai = new GoogleGenAI({ apiKey: aiKey });
const chat = ai.chats.create({
	model: 'gemini-3.1-flash-lite',
	config: {
		systemInstruction: aiPrompt,
		maxOutputTokens: 100,
	}
});
function setAutoCount(data){
	autoCount = data;
}
function getAutoCount(){
	return autoCount;
}
module.exports = {
	setAutoCount,
	getAutoCount
};
// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	client.user.setPresence({ activities: [{ name: defaultStatus }], status: 'online' });
	fs.readFile('count', (err, data) => {
		if (err) throw err;
		nextCount = data
		// in the event a bot goes down and the same user types the next number is very unlikely
		//lastUserCountId = data.split(/\r?\n/)[1];
	});
});
// URI is in config.json
const uri = mongoURI;
const dbClient = new MongoClient(uri);
const database = dbClient.db(dbName);
client.on(Events.GuildCreate, async (guildCreate) => {
	const list = client.guilds.cache.get(guildId);
	database.createCollection(guildId);
	await guildCreate.members.fetch();
	list.members.cache.forEach(member => {
		if (!member.user.bot) {
			database.collection(guildId).insertOne({ level: 0, xp: 0, threshold: 175, userId: member.user.id, warns: [] });
		}
	});

});
client.on(Events.GuildMemberAdd, (guildMemberAdd) => {
	// intialize database entry
	database.createCollection(guildMemberAdd.guild.id);
	if (!guildMemberAdd.user.bot) {
		database.collection(guildMemberAdd.guild.id).insertOne({ level: 0, xp: 0, threshold: 175, userId: guildMemberAdd.user.id, warns: [] });
	}
	
	// log
	const user = guildMemberAdd.user;
	const userpfp = user.avatarURL();
	const timestamp = guildMemberAdd.joinedTimestamp;
	const logsChannel = client.channels.cache.get(logsChannelId);
	const embed = new EmbedBuilder()
		.setDescription(`<@${user.id}> ${user.username}`)
		.setAuthor({ name: user.username, iconURL: userpfp })
		.setTitle(`Member joined!`)
		.setTimestamp(timestamp);
	logsChannel.send({ embeds: [embed] });
});
client.on(Events.GuildMemberRemove, (guildMemberRemove) => {
	// remove database entry
	if (!guildMemberRemove.user.bot) {
		database.collection(guildMemberRemove.guild.id).deleteOne({ userId: guildMemberRemove.user.id });
	}
	// log
	const user = guildMemberRemove.user;
	const userpfp = user.avatarURL();
	const logsChannel = client.channels.cache.get(logsChannelId);
	const embed = new EmbedBuilder()
		.setDescription(`<@${user.id}> ${user.username}`)
		.setAuthor({ name: user.username, iconURL: userpfp })
		.setTitle(`Member left!`)
		.setTimestamp();
	logsChannel.send({ embeds: [embed] });
});
client.on(Events.MessageDelete, (messageDelete) =>{
	const content = messageDelete.content;
	const attachments = messageDelete.attachments;
	const author = messageDelete.author;
	const authorpfp = author.avatarURL();
	const channel = messageDelete.channel;
	const timestamp = messageDelete.createdTimestamp;
	const logsChannel = client.channels.cache.get(logsChannelId);
	const embed = new EmbedBuilder()
		.setDescription(`### Deleted message was in <#${channel.id}>`)
		.setAuthor({ name: author.username, iconURL: authorpfp })
		.addFields(
			{ name: 'Content:', value: content }
		)
		.setTimestamp(timestamp);
	if(!author.bot){
		logsChannel.send({ embeds: [embed] });
		if(typeof attachments.first() != 'undefined'){
			console.log(attachments);
			logsChannel.send('Attachments:');
			attachments.forEach(element => {
				logsChannel.send(element.url);
			});
		}
		
	}
});
client.on(Events.MessageUpdate, (oldMessage, newMessage) =>{
	const originalContent = oldMessage.content;
	const newContent = newMessage.content;
	const oldAttachments = oldMessage.attachments;
	const newAttachments = newMessage.attachments;
	const author = newMessage.author;
	const authorpfp = author.avatarURL();
	const linkToMessage = newMessage.url;
	const channel = newMessage.channel;
	const timestamp = newMessage.createdTimestamp;
	const logsChannel = client.channels.cache.get(logsChannelId);
	const embed = new EmbedBuilder()
		.addFields(
			{ name: 'Original:', value: originalContent},
			{ name: 'Edited:', value: newContent}
		)
		.setAuthor({ name: author.username, iconURL: authorpfp })
		.setDescription(`### Edited message was in <#${channel.id}> [Jump to message](${linkToMessage})`)
		.setTimestamp(timestamp);
	if(!author.bot){
		logsChannel.send({ embeds: [embed] });
		if(typeof oldAttachments.first() != 'undefined'){
			logsChannel.send(/*'Original Attachments:'*/ 'Attachments:');
			oldAttachments.forEach(element => {
				logsChannel.send(element.url);
			});
		}
		// i dont think you can edit attachments
		/*if(typeof newAttachments.first() != 'undefined'){
			logsChannel.send('Edited Attachments:');
			newAttachments.forEach(element => {
				logsChannel.send(element.url);
			});
		}*/
	}
});
// could make different databases per guild
client.on(Events.MessageCreate, async (messageCreate) => {
    if(!messageCreate.author.bot){
		// cooldown
		const userId = messageCreate.author.id;
		const guildId = messageCreate.guild.id;
        const now = Date.now();

        // check last xp time
        const lastXP = xpCooldown.get(userId);
		// update cooldown
		xpCooldown.set(userId, now);
		setTimeout(() => {
			xpCooldown.delete(userId);
		}, xpCooldownTime);
		const lastAI = aiCooldown.get(userId);
		// -- XP GAIN HANDLER --
        const xpMin = 50;
        const xpMax = 100;
        const randomXP = randomInt(xpMin, xpMax);
		let thresholdInc = 175;
		try {
			// collection names are just the guild's id
			const collection = database.collection(guildId);
			// if the user doesnt have a document in their collection, create one (this is the template)
			// every doc has a userId field, so we search the right doc by finding the userid field
			const docFilter = { userId: `${userId}` };
			const levelObject = await collection.findOne(docFilter);
			// prints out the previous state of the document before writing
			// console.log(levelObject);
			const userXP = levelObject.xp;
			const userThreshold = levelObject.threshold;
			const userLevel = levelObject.level;
			thresholdInc = (userLevel * 100) + 75
			// TODO: disable eslint its annoying and implement the level going up and xp roll over
			// (convert the original string template to integers and scan for numbers on createIndex)
			// also think about how you're supposed to write alerts from the bot about level changes (ping user on level update?)
			// DONE!!!!!
			if(userXP + randomXP > userThreshold && !(lastXP && now - lastXP < xpCooldownTime)) {
				
				// XP rollover isn't implemented because it goes into the negatives sometimes, too lazy
				// someone make a pr for this or smth
				const levelUpdateDoc = {
					$inc: {
						level: 1,
						threshold: thresholdInc
					},
					$set: {
						xp: 0
					}
				}
				collection.updateOne(docFilter, levelUpdateDoc);
				// role switch
				switch (levelObject.level) {
					case 5:
						messageCreate.member.roles.add(levelRoles.level5);
						break;
					case 10:
						messageCreate.member.roles.add(levelRoles.level10);
						break;
					case 15:
						messageCreate.member.roles.add(levelRoles.level15);
						break;
					case 20:
						messageCreate.member.roles.add(levelRoles.level20);
						break;
					case 25:
						messageCreate.member.roles.add(levelRoles.level25);
						break;
					case 30:
						messageCreate.member.roles.add(levelRoles.level30);
						break;
					case 50:
						messageCreate.member.roles.add(levelRoles.level50);
						break;
					case 100:
						messageCreate.member.roles.add(levelRoles.level100);
						break;
					default:
						break;
				}
				messageCreate.channel.send(`<@${messageCreate.author.id}> is level **${levelObject.level + 1}**! Congrats!`);
			}else if(!(lastXP && now - lastXP < xpCooldownTime)){
				// else, if the user hasnt met the threshold, just add the XP
				// $inc is increment $set is set
				const levelUpdateDoc = {
					$inc: {
						xp: randomXP
					},
				}
				collection.updateOne(docFilter, levelUpdateDoc);
			}
		} catch (error) {
			console.log('ERROR IN XP CHECK: ' + error);
			// attempt to create a collection (non-destructive)
			database.collection(guildId).insertOne({ level: 0, xp: 0, threshold: 175, userId: userId, warns: [] });
		}
        
		// -- END OF XP GAIN HANDLER --

		// AI (Gemini)
		if(messageCreate.content.startsWith("<@1471915448474927339>") && !(lastAI && now - lastAI < aiCooldownTime)){
			aiCooldown.set(userId, now);
			setTimeout(() => {
				aiCooldown.delete(userId);
			}, aiCooldownTime);
			try {
				const msg = await messageCreate.reply('-# Thinking...');
				let response = await chat.sendMessageStream({message: `${messageCreate.author.username}: ` + messageCreate.content.slice(21)});	
				
				for await (const chunk of response) {
					if(msg.content == '-# Thinking...'){
						await msg.edit(`${chunk.text}`);
					}else{
						await msg.edit(`${msg.content}${chunk.text}`)
					}
				}
				msg.edit(`${msg.content}\n-# Cooldown for 15 seconds...`);
				
				
			} catch (error) {
				await messageCreate.reply('NO MORE AI IM TIRED');
				console.log(error);
			}
		}
		
    }
	// -- COUNTING -- (bots can count! /count)
	// might wanna move counter to db because if bot process is closed counter is reset
	// but dont flood the db with requests also
	if(messageCreate.channelId == countingChannelId){
		// if content is the next count 
		if(messageCreate.content == nextCount.toString() && messageCreate.author.id != lastUserCountId){
			messageCreate.react('✅');
			lastUserCountId = messageCreate.author.id;
			nextCount++;
		// else, if the content is NOT the next count and is a number OR
		// the author of the message is the last person to write the number and its also a number
		}else if(messageCreate.content != nextCount.toString() && !isNaN(messageCreate.content)){
			messageCreate.react('❌');
			autoCount = false;
			await messageCreate.reply('Wrong number! Restart at 1.\n-# Auto count is disabled.');
			lastUserCountId = 0;
			nextCount = 1;
		}else if(messageCreate.author.id == lastUserCountId && !isNaN(messageCreate.content)){
			messageCreate.react('❌');
			autoCount = false;
			await messageCreate.reply("You can't count twice! Restart at 1.\n-# Auto count is disabled.");
			lastUserCountId = 0;
			nextCount = 1;
		}
		// write file on message with a number
		if(!isNaN(messageCreate.content)){
			// NOTE: this is an async way to write the file
			await fs.writeFile('count', nextCount.toString(), (err) => {
				if (err) {
					console.error('Error writing file:', err);
				} else {
					console.log('File saved successfully!');
				}
			});
		}
		// -- AUTO COUNT --
		if(autoCount && messageCreate.channelId == countingChannelId && !isNaN(messageCreate.content) && !messageCreate.author.bot){
			await messageCreate.channel.send(nextCount.toString());
		}
	}
});

// -- COMMAND HANDLER --
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);
	interaction.client.guilds.cache.get(guildId)
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
	try {
		await command.execute(interaction);
		console.log(`/${interaction.commandName} has been called in #${interaction.channel.name} by @${interaction.user.username}`);
	}
	catch (error) {
		if(typeof error.data != 'undefined'){
			await interaction.editReply({
				ephemeral: true,
				content: `Please wait ${error.data.retry_after.toString()}s before using this command again!`
			});
			console.log(`Caught ratelimit error! ${error.data.retry_after}s until next use.`);
			return;
		}
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		}
		else {
			await interaction.reply({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		}
	}	

	
});
// -- END OF COMMAND HANDLER --
client.on(Events.InteractionCreate, (interaction) => {
	if(!interaction.isModalSubmit() && interaction.customId !== 'confessionModal') return;
		const confessText = interaction.fields.getTextInputValue('confessionInput');
		const color = interaction.fields.getStringSelectValues('color');
		const confessionsChannel = client.channels.cache.get(confessionsChannelId);
		const confessionEmbed = new EmbedBuilder()
			.setColor(parseInt(color.slice('0', '1'), 16)) // this throws a ColorConvert error if you dont do this shit
			.setDescription(confessText)
			.setTitle('Confession #test');
		const confirm = new ButtonBuilder().setCustomId('new').setLabel('Confess').setStyle(ButtonStyle.Primary);
		const row = new ActionRowBuilder().addComponents(confirm);
		confessionsChannel.send({
			embeds: [confessionEmbed],
			components: [row]
		})
		const collectorFilter = (i) => i.user.id === interaction.user.id;
		try {
			const confirmation = response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
			if (confirmation.customId === 'new') {

			}
		}catch{
			
		}
		
});
// Log in to Discord with your client's token
client.login(token);
