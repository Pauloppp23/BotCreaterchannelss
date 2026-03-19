const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    InteractionType, 
    ChannelType, 
    PermissionFlagsBits 
} = require('discord.js');

// ================= CONFIGURAÇÃO =================
const TOKEN = ""; // <--- COLOQUE SEU TOKEN AQUI
const PREFIXO = "!";
// ================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Definição das Estruturas de Canais
const estruturas = {
    "games": [
        { nome: "🎮 Games", canais: ["chat-geral", "clipes", "procurar-time", "voice-geral", "voice-squad"] },
        { nome: "📢 Informações", canais: ["regras", "anúncios", "novidades"] }
    ],
    "rp": [
        { nome: "🌆 Roleplay", canais: ["cidade-chat", "histórias", "registro-personagem", "voice-rp", "radio-rp"] }
    ],
    "loja": [
        { nome: "🛒 Loja", canais: ["produtos", "comprar", "suporte-compra", "entregas"] }
    ],
    "comunidade padrão": [
        { nome: "💬 Comunidade", canais: ["chat-geral", "memes", "mídia", "sugestões", "voice-geral"] }
    ],
    "comunidade clássica": [
        { nome: "🏠 Comunidade", canais: ["geral", "conversa", "bots", "música", "voice-lounge"] }
    ],
    "games clássicos": [
        { nome: "🕹️ Jogos", canais: ["minecraft", "roblox", "valorant", "clips", "voice-games"] }
    ],
    "loja avançada": [
        { nome: "🛍️ Loja Avançada", canais: ["catálogo", "promoções", "compras", "suporte", "entregas", "feedback-clientes"] }
    ]
};

client.once('ready', () => {
    console.log(`✅ Bot Profissional Online: ${client.user.tag}`);
    console.log(`🚀 Pronto para criar estruturas de canais.`);
});

// Comando Principal: !criarcanais
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIXO)) return;

    const args = message.content.slice(PREFIXO.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'criarcanais') {
        // Validação de Administrador
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Erro: Apenas membros com a permissão de **Administrador** podem usar este comando.");
        }

        const embed = new EmbedBuilder()
            .setTitle("⚙️ Sistema de Gerenciamento de Canais")
            .setDescription(
                "Bem-vindo ao sistema de automação de estrutura.\n\n" +
                "Ao clicar no botão abaixo, você poderá escolher um modelo pré-definido para o seu servidor. " +
                "O bot criará automaticamente as categorias e os canais com as permissões de segurança configuradas.\n\n" +
                "**Opções Disponíveis:**\n" +
                "• `games`, `rp`, `loja`, `comunidade padrão`\n" +
                "• `comunidade clássica`, `games clássicos`, `loja avançada`"
            )
            .setColor("#2f3136")
            .setThumbnail(message.guild.iconURL())
            .setFooter({ text: "Sistema de Automação Profissional", iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('abrir_modal')
                .setLabel('Criar Canais')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🛠️')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// Gerenciador de Interações (Botões e Modais)
client.on('interactionCreate', async (interaction) => {
    
    // Abrir o Modal ao clicar no botão
    if (interaction.isButton() && interaction.customId === 'abrir_modal') {
        const modal = new ModalBuilder()
            .setCustomId('modal_config_canais')
            .setTitle('Configuração de Estrutura');

        const inputEstrutura = new TextInputBuilder()
            .setCustomId('escolha_usuario')
            .setLabel("Qual tipo de estrutura deseja?")
            .setPlaceholder("Ex: games, rp, loja, comunidade padrão...")
            .setStyle(TextInputStyle.Short)
            .setMinLength(2)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(inputEstrutura);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    // Processar o resultado do Modal
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_config_canais') {
        const escolha = interaction.fields.getTextInputValue('escolha_usuario').toLowerCase();

        if (!estruturas[escolha]) {
            return interaction.reply({ 
                content: `❌ O tipo **"${escolha}"** não é válido. Use um dos nomes listados no painel.`, 
                ephemeral: true 
            });
        }

        await interaction.reply({ content: `🛠️ Iniciando criação da estrutura **${escolha.toUpperCase()}**... Aguarde.`, ephemeral: true });

        try {
            const categoriasParaCriar = estruturas[escolha];

            for (const catInfo of categoriasParaCriar) {
                // Criação da Categoria com permissões travadas para membros
                const categoria = await interaction.guild.channels.create({
                    name: catInfo.nome,
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id, // @everyone
                            deny: [
                                PermissionFlagsBits.ManageChannels,
                                PermissionFlagsBits.ManageRoles,
                                PermissionFlagsBits.ManageWebhooks
                            ],
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
                        }
                    ]
                });

                // Criação dos Canais dentro da Categoria
                for (const nomeCanal of catInfo.canais) {
                    // Se o nome tiver 'voice', 'squad', 'lounge' ou 'radio', cria canal de voz
                    const ehVoz = nomeCanal.includes('voice') || nomeCanal.includes('squad') || nomeCanal.includes('lounge') || nomeCanal.includes('radio');

                    await interaction.guild.channels.create({
                        name: nomeCanal,
                        type: ehVoz ? ChannelType.GuildVoice : ChannelType.GuildText,
                        parent: categoria.id
                    });
                }
            }

            await interaction.followUp({ 
                content: `✅ **Sucesso!** A estrutura de **${escolha.toUpperCase()}** foi gerada e as permissões foram configuradas corretamente.`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error(error);
            await interaction.followUp({ content: "⚠️ Ocorreu um erro ao criar os canais. Verifique se o meu cargo está no topo da lista e se tenho permissão de 'Gerenciar Canais'.", ephemeral: true });
        }
    }
});

// Login do Bot
client.login(TOKEN).catch(err => {
    console.error("❌ Erro ao iniciar o bot: Token inválido ou problemas de conexão.");
});
