const { ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { MongoClient, Collection } = require('mongodb');
const { mongoURI, dbName } = require('../../config.json');
const uri = mongoURI;
const dbClient = new MongoClient(uri);
const database = dbClient.db(dbName);

module.exports = {
    // DESTRUCTION
	data: new SlashCommandBuilder().setName('resetwarns').setDescription('Resets ALL warns on the server'),
	async execute(interaction) {
        const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('RESET THEM ALL!').setStyle(ButtonStyle.Danger);
        const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel.').setStyle(ButtonStyle.Primary);
		const row = new ActionRowBuilder().addComponents(confirm, cancel);
        // saataa andagii!!!
        const askEmbed = new EmbedBuilder()
            .setColor(0xff3b3b)
            .setDescription(`THIS COMMAND WILL RESET ALL WARNS FOR EVERY MEMBER IN THIS SERVER! ARE YOU SURE?`);
        const confirmedEmbed = new EmbedBuilder()
            .setColor(0x3bff3b)
            .setDescription(`All warns have been reset.`);
        const cancelledEmbed = new EmbedBuilder()
            .setColor(0x000000)
            .setDescription(`All warns have ***not*** been reset.`);
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
                    const updateDoc = {
                        $set: {
                            warns: []
                        },
                    };
                    database.collection(interaction.guild.id).updateMany({}, updateDoc);
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
        }
        
	},
};