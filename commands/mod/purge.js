const { SlashCommandBuilder, PermissionsBitField, MessageFlags, EmbedBuilder } = require('discord.js');
const { logsChannelId } = require('../../config.json');
module.exports = {
	data: new SlashCommandBuilder().setName('purge').setDescription('purge messages')
		.addNumberOption((option) => option.setName('amount').setDescription('amount of messages to purge').setRequired(true)),
	async execute(interaction) {
		let amount = interaction.options.getNumber('amount');
        const logsChannel = interaction.client.channels.cache.get(logsChannelId);
        const author = interaction.user;
        const authorpfp = author.avatarURL();
        const embed = new EmbedBuilder()
            .setDescription(`### Bulk delete of messages in <#${interaction.channel.id}>`)
            .setAuthor({ name: author.username, iconURL: authorpfp })
            .addFields(
                { name: 'Amount:', value: amount.toString() }
            )
            .setTimestamp();
		if(interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) /*|| interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages) not needed in tsgc's case, might uncomment if needed*/){
            try {
                await interaction.channel.bulkDelete(amount)
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content: `Purged ${amount} messages.`
                });
                await logsChannel.send({embeds: [embed]});
            } catch (error) {
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    content: `Error: ${error}`
                });
            }
			return;
		}else{
			await interaction.reply({
				content: 'You do not have permissions for this command.',
				ephemeral: true
			});
			return;
		}
	},
};