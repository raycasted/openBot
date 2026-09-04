const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder().setName('kick').setDescription('kick user')
		.addUserOption((option) => option.setName('user').setDescription('user to kick').setRequired(true))
		.addStringOption((option) => option.setName('reason').setDescription('reason for kick').setRequired(false)) ?? 'No reason provided.',
	async execute(interaction) {
		const user = interaction.options.getUser('user');
		let reason = interaction.options.getString('reason');
		if(interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers) || interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)){
			// undefined is supposed to be messages to delete, undefined is none
			interaction.guild.members.kick(user);
			if(reason == null){
				reason = 'No reason provided.';
			}
			await interaction.reply(`Kicked member ***${user.username}*** for reason ***${reason}***`);
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