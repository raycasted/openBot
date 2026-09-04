const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { MongoClient, Collection } = require('mongodb');
const { mongoURI, dbName } = require('../../config.json');
const uri = mongoURI;
const dbClient = new MongoClient(uri);
const database = dbClient.db(dbName);

module.exports = {
    // CREATION
	data: new SlashCommandBuilder().setName('addlevels').setDescription('Adds or removes a specified amount of levels to a user. (negative for removing)')
    .addUserOption((option) => option.setName('user').setDescription('The user to add the levels to').setRequired(true))
    .addIntegerOption((option) => option.setName('levels').setDescription('Amount of levels to add/remove').setRequired(true)),
	async execute(interaction) {
        const levelAmount = interaction.options.getInteger('levels');
        const userToAdd = interaction.options.getUser('user');
        if(userToAdd.bot){
            await interaction.reply("Discord bots don't have levels!");
            return;
        }
        if(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)){
            const userCollection = database.collection(interaction.guild.id);
            const docFilter = { userId: `${userToAdd.id}` };

            const levelObject = await userCollection.findOne(docFilter);

            const userLevel = levelObject.level;

            const newLevel = Math.max(0, userLevel + levelAmount);

            const levelUpdateDoc = {
                $set: {
                    level: newLevel,
                    threshold: (newLevel * 100) + 75,
                    xp: 0
                }
            };

            await userCollection.updateOne(docFilter, levelUpdateDoc);

            await interaction.reply(
                `Added **${levelAmount}** level(s) to **${userToAdd.username}**`
            );
        }else{
            await interaction.editReply({
                content: 'You do not have permissions for this command.',
                ephemeral: true
            });
        }
        
        
	},
};
