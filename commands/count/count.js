const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { countingChannelId } = require('../../config.json');
const fs = require('node:fs');
const { setAutoCount, getAutoCount } = require('../../index.js');
module.exports = {
	data: new SlashCommandBuilder().setName('count').setDescription('Count in the counting channel'),
	async execute(interaction) {
        const channel = interaction.client.channels.cache.get(countingChannelId);
        if(!getAutoCount()) setAutoCount(true);
        else setAutoCount(false);
		if(getAutoCount() == true){
            await interaction.reply({
                content: 'I will now count!',
            });
        }
        if(getAutoCount() == false){
            await interaction.reply({
                content: 'I will no longer count.',
            });
        }
		return;
	},
};