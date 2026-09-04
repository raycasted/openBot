const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const { mongoURI, dbName } = require('../../config.json');
const uri = mongoURI;
const dbClient = new MongoClient(uri);
const database = dbClient.db(dbName);
module.exports = {
	data: new SlashCommandBuilder().setName('resetuserwarns').setDescription('Resets warns for a user')
        .addUserOption((option) => option.setName('user').setDescription('user to reset warns for').setRequired(true)),
	async execute(interaction) {
        const user = interaction.options.getUser('user');
        if(user.bot){
			await interaction.reply("Discord bots don't have warns!");
		}
        if(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) || interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)){
            
            const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Reset!').setStyle(ButtonStyle.Danger);
            const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel.').setStyle(ButtonStyle.Primary);
            const row = new ActionRowBuilder().addComponents(confirm, cancel);
            // saataa andagii!!!
            const askEmbed = new EmbedBuilder()
                .setColor(0xff3b3b)
                .setDescription(`Are you sure you want to reset warns for **${user.username}**?\n This will reset all of their warns!`);
            const confirmedEmbed = new EmbedBuilder()
                .setColor(0x3bff3b)
                .setDescription(`Warns have been reset for **${user.username}**.`);
            const cancelledEmbed = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(`Warns have ***not*** been reset for **${user.username}**.`);
            const response = await interaction.reply({
                embeds: [askEmbed],
                components: [row],
                withResponse: true,
                ephemeral: true
            });
            const collectorFilter = (i) => i.user.id === interaction.user.id;
            try {
                const confirmation = await response.resource.message.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

                if (confirmation.customId === 'confirm') {
                    const updateDoc = {
                        $set: {
                            warns: []
                        },
                    };
                    const collectionToReset = database.collection(interaction.guild.id).updateOne({ userId: user.id }, updateDoc);
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