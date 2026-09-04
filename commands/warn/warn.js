const { SlashCommandBuilder, PermissionsBitField, time } = require('discord.js');
const { MongoClient } = require('mongodb');
const { mongoURI, dbName } = require('../../config.json');
const uri = mongoURI;
const dbClient = new MongoClient(uri);
const database = dbClient.db(dbName);
module.exports = {
	data: new SlashCommandBuilder().setName('warn').setDescription('Warns the specified user')
        .addUserOption((option) => option.setName('user').setDescription('user to warn').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('the reason of the warn').setRequired(true)),
	async execute(interaction) {
        if(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) || interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)){
            const reason = interaction.options.getString('reason');
            const moderator = interaction.member.user.username;
            const timestamp = time();
            const user = interaction.options.getUser('user');
            if(user.bot){
			    await interaction.reply("Discord bots don't have warns!");
		    }
		    const collection = database.collection(interaction.guild.id);
            const warnDoc = await collection.findOne({ userId: user.id });
            const warns = warnDoc.warns;
            const newWarnData = {
                'moderator': moderator,
                'timestamp': timestamp,
                'reason': reason
            };
            warns.push(newWarnData);
            const updateDoc = {
                $set:{
                    warns
                }
            }
            collection.updateOne({ userId: user.id }, updateDoc);
            // change this to embed?
            await interaction.reply(`Warned member ***${user.username}*** for reason ***${reason}***.`);
        }else{
            await interaction.reply({
				content: 'You do not have permissions for this command.',
				ephemeral: true
			});
			return;
        }
	},
};
