const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder().setName('ban').setDescription('ban user')
		.addUserOption((option) => option.setName('user').setDescription('user to ban').setRequired(true))
		.addStringOption((option) => option.setName('reason').setDescription('reason for ban').setRequired(false)) ?? 'No reason provided.',
	async execute(interaction) {
		const user = interaction.options.getUser('user');
		let reason = interaction.options.getString('reason');
		if(interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers) || interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)){
			// undefined is supposed to be messages to delete, undefined is none
			interaction.guild.members.ban(user, { undefined, reason: reason });
			if(reason == null){
				reason = 'No reason provided.';
			}
			await interaction.reply(`Banned member ***${user.username}*** for reason ***${reason}***`);
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