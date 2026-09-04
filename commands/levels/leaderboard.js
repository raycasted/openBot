const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const { mongoURI, dbName } = require('../../config.json');
const uri = mongoURI;
const dbClient = new MongoClient(uri);
const database = dbClient.db(dbName);
module.exports = {
	// get levels for each user, put them in an array and sort its
	// this can ratelimit (30s until next use)
	data: new SlashCommandBuilder().setName('leaderboard').setDescription('Gets the server leaderboard for levels'),
	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setTitle('LEADERBOARD')
			.setDescription(`# ${interaction.guild.name}`)
			.setThumbnail(interaction.guild.iconURL());
		const collection = database.collection(interaction.guild.id);
		await interaction.reply({ embeds: [new EmbedBuilder().setDescription('Fetching leaderboard...')]});
		const list = interaction.client.guilds.cache.get(interaction.guild.id);
		let memberLevels = new Array();
		await interaction.guild.members.fetch();
		for (const member of list.members.cache.values()) {
			if (!member.user.bot) {
				const docFilter = { userId: member.user.id };
				

				const levelObject = await collection.findOne(docFilter);

				if (levelObject) {
					// level two times 1000 plus 112 xp i have
					// (userLevel * level1Threshold) + remainingXP
					/*const rankingValue = (levelObject.level * 1000) + levelObject.xp;
					memberLevels[member.user.displayName] = rankingValue;*/
					memberLevels.push(levelObject);
				}
			}
		}
		
		memberLevels.sort((a, b) => (b.level - a.level) || (b.xp - a.xp));
		console.log(memberLevels);
		for (let i = 0; i < Math.min(memberLevels.length, 10); i++) {
			const level = memberLevels[i].level;
			const xp = memberLevels[i].xp;
			const name = interaction.client.users.cache.get(memberLevels[i].userId).displayName;
			embed.addFields({ name: `#${i+1}: ${name}`, value: `Level: ${level}\nXP: ${xp}`})
		}
		// make this a fancy embed using embed constructor
		// TODO: implement pages (10 members per page) and button objects on the embed
		await interaction.editReply({ embeds: [embed] });
	},
};
