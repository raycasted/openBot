const { SlashCommandBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const { mongoURI, dbName } = require('../../config.json');
const uri = mongoURI;
const dbClient = new MongoClient(uri);
const database = dbClient.db(dbName);
module.exports = {
	data: new SlashCommandBuilder().setName('level').setDescription('Shows the level of the specified user.')
	.addUserOption((option) => option.setName('user').setDescription('User to check levels of').setRequired(true)),
	async execute(interaction) {
		const user = interaction.options.getUser('user');
		if(user.bot){
			await interaction.reply("Discord bots don't have levels!");
		}
		const collection = database.collection(interaction.guild.id);
		const docFilter = { userId: `${user.id}` };	
		const levelObject = await collection.findOne(docFilter);
		// (value / threshold) * segments
		const segments = Math.floor((levelObject.xp / levelObject.threshold) * 15);
		let progressBar = '';
		// im way too lazy
		if(segments == 0){
			progressBar = '(▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒)'
		}else if(segments == 1){
			progressBar = '(█▒▒▒▒▒▒▒▒▒▒▒▒▒▒)'
		}else if(segments == 2){
			progressBar = '(██▒▒▒▒▒▒▒▒▒▒▒▒▒)'
		}else if(segments == 3){
			progressBar = '(███▒▒▒▒▒▒▒▒▒▒▒▒)'
		}else if(segments == 4){
			progressBar = '(████▒▒▒▒▒▒▒▒▒▒▒)'
		}else if(segments == 5){
			progressBar = '(█████▒▒▒▒▒▒▒▒▒▒)'
		}else if(segments == 6){
			progressBar = '(██████▒▒▒▒▒▒▒▒▒)'
		}else if(segments == 7){
			progressBar = '(███████▒▒▒▒▒▒▒▒)'
		}else if(segments == 8){
			progressBar = '(████████▒▒▒▒▒▒▒)'
		}else if(segments == 9){
			progressBar = '(█████████▒▒▒▒▒▒)'
		}else if(segments == 10){
			progressBar = '(██████████▒▒▒▒▒)'
		}else if(segments == 11){
			progressBar = '(███████████▒▒▒▒)'
		}else if(segments == 12){
			progressBar = '(████████████▒▒▒)'
		}else if(segments == 13){
			progressBar = '(█████████████▒▒)'
		}else if(segments == 14){
			progressBar = '(██████████████▒)'
		}else if(segments == 15){
			progressBar = '(███████████████)'
		}
		if(levelObject == null){
			await interaction.reply('Member has no levels or XP!');
		}
		else if((levelObject.level == 0 && levelObject.xp == 0 && levelObject.threshold == 1000)){
			await interaction.reply('Member has no levels or XP!');
		}else{
			await interaction.reply(`Member **${user.username}** is level **${levelObject.level}**, and **${levelObject.xp}** XP.\n You need **${levelObject.threshold - levelObject.xp}** more XP to level up.\n${progressBar}`);
		}
	},
};