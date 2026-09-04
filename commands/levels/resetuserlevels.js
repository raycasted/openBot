const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { MongoClient } = require('mongodb');
const { mongoURI, dbName } = require('../../config.json');
const uri = mongoURI;
const dbClient = new MongoClient(uri);
const database = dbClient.db(dbName);
module.exports = {
	data: new SlashCommandBuilder().setName('resetuserlevels').setDescription('Resets the levels of a specified member')
	    .addUserOption((option) => option.setName('user').setDescription('User to reset levels of').setRequired(true)),
	async execute(interaction) {
        const resetDoc = {
            $set: {
                level: 0,
                xp: 0,
                threshold: 75
            }
        }
        const user = interaction.options.getUser('user');
        if(user.bot){
            await interaction.reply("Discord bots don't have levels!");
            return;
        }
        const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Reset!').setStyle(ButtonStyle.Danger);
        const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel.').setStyle(ButtonStyle.Primary);
		const row = new ActionRowBuilder().addComponents(confirm, cancel);
        // saataa andagii!!!
        const askEmbed = new EmbedBuilder()
            .setColor(0xff3b3b)
            .setDescription(`Are you sure you want to reset levels for **${user.username}**?\n This will reset all of their XP and levels!`);
        const confirmedEmbed = new EmbedBuilder()
            .setColor(0x3bff3b)
            .setDescription(`Levels have been reset for **${user.username}**.`);
        const cancelledEmbed = new EmbedBuilder()
            .setColor(0x000000)
            .setDescription(`Levels have ***not*** been reset for **${user.username}**.`);
        const response = await interaction.reply({
            embeds: [askEmbed],
            components: [row],
            withResponse: true,
            ephemeral: true
        });
        if(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)){
            const collectorFilter = (i) => i.user.id === interaction.user.id;
            try {
                const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

                if (confirmation.customId === 'confirm') {
                    // make sure components is blank otherwise the buttons will be there but fail to do anything
                    const updateToTemplateDoc = { $set: { level: 0, xp: 0, threshold: 175, userId: interaction.user.id } }
                    database.collection(interaction.guild.id).updateOne({ userId: user.id }, updateToTemplateDoc);
                    await confirmation.update({ embeds: [confirmedEmbed], components: [], ephemeral: false });
                    
                } else if (confirmation.customId === 'cancel') {
                    await confirmation.update({ embeds: [cancelledEmbed], components: [] });
                }
            } catch {
                await interaction.deleteReply();
            }
        }else{
            await interaction.reply({
                content: 'You do not have permissions for this command.',
                ephemeral: true
            });
            return;
        }
        
	},
};
