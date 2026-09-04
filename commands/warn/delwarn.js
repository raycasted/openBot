const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const { mongoURI, dbName } = require('../../config.json');
const uri = mongoURI;
const dbClient = new MongoClient(uri);
const database = dbClient.db(dbName);
module.exports = {
	data: new SlashCommandBuilder().setName('delwarn').setDescription('Delete a specific warn for a user')
        .addUserOption((option) => option.setName('user').setDescription('user to delete the warn for').setRequired(true))
        .addStringOption((option) => option.setName('reason').setDescription('the warn to delete').setRequired(true)),
	async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        if(user.bot){
			await interaction.reply("Discord bots don't have warns!");
		}
        if(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) || interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)){
            const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Delete!').setStyle(ButtonStyle.Danger);
            const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel.').setStyle(ButtonStyle.Primary);
            const row = new ActionRowBuilder().addComponents(confirm, cancel);
            // saataa andagii!!!
            const askEmbed = new EmbedBuilder()
                .setColor(0xff3b3b)
                .setDescription(`Are you sure you want to delete warn **${reason}** for **${user.username}**?`);
            let confirmedEmbed = new EmbedBuilder()
                .setColor(0x3bff3b)
                .setDescription(`Warn **${reason}** has been deleted for **${user.username}**.`);
            const cancelledEmbed = new EmbedBuilder()
                .setColor(0x000000)
                .setDescription(`Warn **${reason}** has ***not*** been reset for **${user.username}**.`);
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
                    const collection = database.collection(interaction.guild.id);
                    let warnDoc = await collection.findOne({ userId: user.id });
                    let updateDoc = {};
                    // flag to check if the reason was found in the warn object array
                    let isSuccess = false;
                    // Source - https://stackoverflow.com/a/2166784
                    // Posted by Matthew Flaschen
                    // Retrieved 2026-03-14, License - CC BY-SA 2.5
                    for(let i = 0; i < warnDoc.warns.length; i++)
                    {
                        if(warnDoc.warns[i].reason == reason)
                        {
                            isSuccess = true;
                            warnDoc.warns.splice(i, 1);
                            updateDoc = 
                            {
                                $set: {
                                    warns: warnDoc.warns
                                }
                            }
                        }
                    }
                    // if NOT a success, change embed to this
                    if(!isSuccess){
                        confirmedEmbed.setDescription(`Member **${user.username}** has no warn with reason **${reason}**!`).setColor(0x000000);
                    }else{
                        // this will error out if its outside the else because updatedoc will be null if its not successful
                        collection.updateOne({ userId: user.id }, updateDoc);
                    }
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