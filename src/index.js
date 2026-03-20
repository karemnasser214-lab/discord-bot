import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, PermissionFlagsBits, EmbedBuilder } from "discord.js";
if (!process.env.TOKEN) throw new Error("TOKEN secret is missing");
if (!process.env.CLIENT_ID) throw new Error("CLIENT_ID secret is missing");
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
function decisionCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const r = (s, l) => Array.from({ length: l }, () => s[Math.floor(Math.random() * s.length)]).join("");
  return `${r(letters, 1)}${r(numbers, 2)}-${r(letters, 1)}${r(numbers, 2)}`;
}
const HIRE_SHEET = "https://docs.google.com/spreadsheets/d/1pMu1J3WRe3eKiW6lqa6c00hU7FugLMHbF35LyPVmd-w/export?format=csv&gid=103592681";
const PROMOTE_SHEET = "https://docs.google.com/spreadsheets/d/1pMu1J3WRe3eKiW6lqa6c00hU7FugLMHbF35LyPVmd-w/export?format=csv&gid=942337148";
const RANKS = { "ملازم": "1483442401354715137", "وكيل ضابط أول": "1483442331364495370", "وكيل ضابط": "1483442299387248673", "رقيب أول": "1483442278264471716", "رقيب": "1483442228373487626", "عريف": "1483442157955055716", "وكيل عريف": "1483253616692170933", "حارس": "1483132901515067514" };
const RANK_ORDER = ["ملازم", "وكيل ضابط أول", "وكيل ضابط", "رقيب أول", "رقيب", "عريف", "وكيل عريف", "حارس"];
const APPROVAL_CHOICES = [{ name: "قائد الشرطة", value: "1483143249014296739" }, { name: "نائب قائد الشرطة", value: "1483474508630331462" }, { name: "قائد الحرس", value: "1483143272183365652" }, { name: "نائب قائد الحرس", value: "1483474540876140564" }, { name: "قائد الدفاع", value: "1483143294941663323" }, { name: "نائب قائد الدفاع", value: "1483474573755289670" }, { name: "مدير الكراج", value: "1483143318505263194" }, { name: "نائب مدير الكراج", value: "1483474599781073057" }];
const commands = [
  new SlashCommandBuilder().setName("إعطاء-رتبة").setDescription("إعطاء رتبة لـ شخص").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true)).addRoleOption(o => o.setName("role1").setDescription("Role").setRequired(true)).addRoleOption(o => o.setName("role2").setDescription("Role2 (اختياري)").setRequired(false)),
  new SlashCommandBuilder().setName("إزالة-رتبة").setDescription("إزالة رتبة من شخص").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true)).addRoleOption(o => o.setName("role1").setDescription("Role").setRequired(true)).addRoleOption(o => o.setName("role2").setDescription("Role2 (اختياري)").setRequired(false)),
  new SlashCommandBuilder().setName("تغيير-اسم").setDescription("تغيير اسم شخص").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true)).addStringOption(o => o.setName("الاسم").setDescription("الاسم الجديد").setRequired(true)),
  new SlashCommandBuilder().setName("إرجاع-الاسم-الأصلي").setDescription("إرجاع الاسم الأصلي للشخص").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true)),
  new SlashCommandBuilder().setName("توظيف-دفعة").setDescription("توظيف الوظائف المعتمدة").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addRoleOption(o => o.setName("role1").setDescription("الرول الوظيفي").setRequired(true)).addStringOption(o => o.setName("اعتماد").setDescription("رتبتك القيادية").setRequired(true).addChoices(...APPROVAL_CHOICES)),
  new SlashCommandBuilder().setName("ترقيات").setDescription("إدارة ترقيات الوظائف المعتمدة").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addStringOption(o => o.setName("اعتماد").setDescription("رتبتك القيادية").setRequired(true).addChoices(...APPROVAL_CHOICES)),
  new SlashCommandBuilder().setName("إضافة-سجل-الوظيفي").setDescription("إضافة سجل وظيفي لعضو عبر DM").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true)).addStringOption(o => o.setName("السبب").setDescription("السجل / السبب").setRequired(true)).addStringOption(o => o.setName("الوظيفة").setDescription("الوظيفة").setRequired(true).addChoices({ name: "إدارة الشرطة", value: "إدارة الشرطة" }, { name: "شركة الرائد للحراسة", value: "شركة الرائد للحراسة" }, { name: "الدفاع المدني", value: "الدفاع المدني" }, { name: "كراج ميكانيكي", value: "كراج ميكانيكي" })),
].map(c => c.toJSON());
const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => { try { await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands }); console.log("تم تسجيل الأوامر ✅"); } catch (err) { console.error("فشل تسجيل الأوامر:", err); } })();
client.on("error", (err) => { console.error("خطأ:", err.message); });
client.once("ready", () => console.log(`البوت جاهز: ${client.user.tag} ✅`));
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;
  if (commandName === "إعطاء-رتبة") {
    const member = interaction.options.getMember("الشخص"), role1 = interaction.options.getRole("role1"), role2 = interaction.options.getRole("role2");
    if (!member || !role1) { await interaction.reply({ content: "❌ حدث خطأ تواصل مع الإدارة", ephemeral: true }); return; }
    try { await member.roles.add(role1.id); if (role2) await member.roles.add(role2.id); const embed = new EmbedBuilder().setColor("#2ecc71").setTitle("<:719099990634659922:1417184611892592733> تمت صرف الرتبة").addFields({ name: "<:719099990634659922:1417184611892592733> الشخص", value: `<@${member.id}>`, inline: true }, { name: "<:719099990634659922:1417184611892592733> Role1", value: `<@&${role1.id}>`, inline: true }, ...(role2 ? [{ name: "<:719099990634659922:1417184611892592733> Role2", value: `<@&${role2.id}>`, inline: true }] : [])).setTimestamp(); await interaction.reply({ embeds: [embed], ephemeral: true }); } catch { await interaction.reply({ content: "❌ حدث خطأ تواصل مع الإدارة", ephemeral: true }); }
    return;
  }
  if (commandName === "إزالة-رتبة") {
    const member = interaction.options.getMember("الشخص"), role1 = interaction.options.getRole("role1"), role2 = interaction.options.getRole("role2");
    if (!member || !role1) { await interaction.reply({ content: "❌ حدث خطأ", ephemeral: true }); return; }
    try { await member.roles.remove(role1.id); if (role2) await member.roles.remove(role2.id); const embed = new EmbedBuilder().setColor("#e74c3c").setTitle("<:719099990634659922:1417184611892592733> تمت إزالة الرتبة").addFields({ name: "<:719099990634659922:1417184611892592733> الشخص", value: `<@${member.id}>`, inline: true }, { name: "<:719099990634659922:1417184611892592733> Role1", value: `<@&${role1.id}>`, inline: true }, ...(role2 ? [{ name: "<:719099990634659922:1417184611892592733> Role2", value: `<@&${role2.id}>`, inline: true }] : [])).setTimestamp(); await interaction.reply({ embeds: [embed], ephemeral: true }); } catch { await interaction.reply({ content: "❌ فشل إزالة الرتبة.", ephemeral: true }); }
    return;
  }
  if (commandName === "تغيير-اسم") {
    const member = interaction.options.getMember("الشخص"), name = interaction.options.getString("الاسم", true);
    if (!member) { await interaction.reply({ content: "❌ حدث خطأ", ephemeral: true }); return; }
    try { await member.setNickname(name); await interaction.reply({ content: `✅ تم تغيير الاسم إلى: \`${name}\``, ephemeral: true }); } catch { await interaction.reply({ content: "❌ فشل تغيير الاسم.", ephemeral: true }); }
    return;
  }
  if (commandName === "إرجاع-الاسم-الأصلي") {
    const member = interaction.options.getMember("الشخص");
    if (!member) { await interaction.reply({ content: "❌ حدث خطأ", ephemeral: true }); return; }
    try { await member.setNickname(null); await interaction.reply({ content: `✅ تم إرجاع الاسم الأصلي لـ <@${member.id}>`, ephemeral: true }); } catch { await interaction.reply({ content: "❌ فشل.", ephemeral: true }); }
    return;
  }
  if (commandName === "توظيف-دفعة") {
    await interaction.deferReply({ ephemeral: true });
    const role1 = interaction.options.getRole("role1", true), leaderRoleId = interaction.options.getString("اعتماد", true);
    try {
      const rows = (await (await fetch(HIRE_SHEET)).text()).split("\n").slice(1);
      const grouped = {}; for (const rank of RANK_ORDER) grouped[rank] = [];
      for (const row of rows) { const cols = row.split(","); const id = cols[1]?.trim(), name = cols[2]?.trim(), code = cols[3]?.trim(), rank = cols[4]?.trim(); if (!id || !rank) continue; try { const member = await interaction.guild.members.fetch(id); await
