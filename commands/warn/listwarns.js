const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const { mongoURI, dbName } = require('../../config.json');
const uri = mongoURI;
const dbClient = new MongoClient(uri);
const database = dbClient.db(dbName);
module.exports = {
	data: new SlashCommandBuilder().setName('listwarns').setDescription('Gets all warns for the specified user')
        .addUserOption((option) => option.setName('user').setDescription('user to get warns for').setRequired(true)),
	async execute(interaction) {
        const user = interaction.options.getUser('user');
        if(user.bot){
			await interaction.reply("Discord bots can't get warns!");
		}
        if(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) || interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)){
            const collection = database.collection(interaction.guild.id);
            const warnDoc = await collection.findOne({ userId: user.id });
            const warnArray = warnDoc.warns;
            let reasonList = [];
            let modList = [];
            let timestampList = [];
            let embed = new EmbedBuilder()
                .setColor('#D2042D')
                .setTitle(`Warns for ${user.username}`)
                .setAuthor({ name: `requested by ${interaction.member.user.username}`, iconURL: interaction.member.user.avatarURL() });
            for (let i = 0; i < warnArray.length; i++) {
                embed.addFields({ name: `Warn ${i+1} reason:`, value: warnArray[i].reason });
                embed.addFields({ inline: true, name: 'Moderator:', value: `@${warnArray[i].moderator}` });
                embed.addFields({ inline: true, name: 'Time:', value: warnArray[i].timestamp });

                // you could lowk format it in an embed with this
                reasonList.push(warnArray[i].reason);
                modList.push(warnArray[i].moderator);
                timestampList.push(warnArray[i].timestamp);
            }
            if(warnArray == 0){
                await interaction.reply(`Member ***${user.username}*** has no warns.`);
                return;
            }
            // TODO: change this to embed asap
            await interaction.reply({ embeds: [embed] });
            //await interaction.reply(`Member ***${user.username}*** has the following warns:\n ***${timestampList}***`);        
        }
	},
};