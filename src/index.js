import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";

if (!process.env.TOKEN) throw new Error("TOKEN secret is missing");
if (!process.env.CLIENT_ID) throw new Error("CLIENT_ID secret is missing");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

function decisionCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const r = (s, l) =>
    Array.from({ length: l }, () => s[Math.floor(Math.random() * s.length)]).join("");
  return `${r(letters, 1)}${r(numbers, 2)}-${r(letters, 1)}${r(numbers, 2)}`;
}

const HIRE_SHEET =
  "https://docs.google.com/spreadsheets/d/1pMu1J3WRe3eKiW6lqa6c00hU7FugLMHbF35LyPVmd-w/export?format=csv&gid=103592681";
const PROMOTE_SHEET =
  "https://docs.google.com/spreadsheets/d/1pMu1J3WRe3eKiW6lqa6c00hU7FugLMHbF35LyPVmd-w/export?format=csv&gid=942337148";

const RANKS = {
  "ملازم": "1483442401354715137",
  "وكيل ضابط أول": "1483442331364495370",
  "وكيل ضابط": "1483442299387248673",
  "رقيب أول": "1483442278264471716",
  "رقيب": "1483442228373487626",
  "عريف": "1483442157955055716",
  "وكيل عريف": "1483253616692170933",
  "حارس": "1483132901515067514",
};

const RANK_ORDER = [
  "ملازم", "وكيل ضابط أول", "وكيل ضابط",
  "رقيب أول", "رقيب", "عريف", "وكيل عريف", "حارس",
];

const COMMITTEE_ROLE = "1484710458438193272";

const JOB_ROLES = {
  "إدارة الشرطة": "1483461854352380106",
  "شركة الرائد للحراسة": "1483132872155070738",
  "الدفاع المدني": "1483461905916891198",
  "كراج ميكانيكي": "1483461943946776647",
};

const APPROVAL_CHOICES = [
  { name: "قائد الشرطة", value: "1483143249014296739" },
  { name: "نائب قائد الشرطة", value: "1483474508630331462" },
  { name: "قائد الحرس", value: "1483143272183365652" },
  { name: "نائب قائد الحرس", value: "1483474540876140564" },
  { name: "قائد الدفاع", value: "1483143294941663323" },
  { name: "نائب قائد الدفاع", value: "1483474573755289670" },
  { name: "مدير الكراج", value: "1483143318505263194" },
  { name: "نائب مدير الكراج", value: "1483474599781073057" },
];

const commands = [
  new SlashCommandBuilder()
    .setName("إعطاء-رتبة")
    .setDescription("إعطاء رتبة لـ شخص")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true))
    .addRoleOption(o => o.setName("role1").setDescription("Role").setRequired(true))
    .addRoleOption(o => o.setName("role2").setDescription("Role2 (اختياري)").setRequired(false)),
  new SlashCommandBuilder()
    .setName("إزالة-رتبة")
    .setDescription("إزالة رتبة من شخص")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true))
    .addRoleOption(o => o.setName("role1").setDescription("Role").setRequired(true))
    .addRoleOption(o => o.setName("role2").setDescription("Role2 (اختياري)").setRequired(false)),
  new SlashCommandBuilder()
    .setName("تغيير-اسم")
    .setDescription("تغيير اسم شخص")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true))
    .addStringOption(o => o.setName("الاسم").setDescription("الاسم الجديد").setRequired(true)),
  new SlashCommandBuilder()
    .setName("إرجاع-الاسم-الأصلي")
    .setDescription("إرجاع الاسم الأصلي للشخص")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true)),
  new SlashCommandBuilder()
    .setName("توظيف-دفعة")
    .setDescription("توظيف الوظائف المعتمدة")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption(o => o.setName("role1").setDescription("الرول الوظيفي").setRequired(true))
    .addStringOption(o =>
      o.setName("اعتماد").setDescription("رتبتك القيادية").setRequired(true).addChoices(...APPROVAL_CHOICES)
    ),
  new SlashCommandBuilder()
    .setName("ترقيات")
    .setDescription("إدارة ترقيات الوظائف المعتمدة")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(o =>
      o.setName("اعتماد").setDescription("رتبتك القيادية").setRequired(true).addChoices(...APPROVAL_CHOICES)
    ),
  new SlashCommandBuilder()
    .setName("إضافة-سجل-الوظيفي")
    .setDescription("إضافة سجل وظيفي لعضو عبر DM")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName("الشخص").setDescription("منشن").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("السجل / السبب").setRequired(true))
    .addStringOption(o =>
      o.setName("الوظيفة").setDescription("الوظيفة").setRequired(true).addChoices(
        { name: "إدارة الشرطة", value: "إدارة الشرطة" },
        { name: "شركة الرائد للحراسة", value: "شركة الرائد للحراسة" },
        { name: "الدفاع المدني", value: "الدفاع المدني" },
        { name: "كراج ميكانيكي", value: "كراج ميكانيكي" }
      )
    ),
  new SlashCommandBuilder()
    .setName("لجنة-الرقابة")
    .setDescription("قرار لجنة الرقابة للترقية")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption(o => o.setName("الشخص").setDescription("منشن الشخص").setRequired(true))
    .addStringOption(o =>
      o.setName("الرتبة-الحالية").setDescription("الرتبة الحالية").setRequired(true)
        .addChoices(...RANK_ORDER.map(r => ({ name: r, value: r })))
    )
    .addStringOption(o =>
      o.setName("الوظيفة").setDescription("الوظيفة").setRequired(true).addChoices(
        { name: "إدارة الشرطة", value: "إدارة الشرطة" },
        { name: "شركة الرائد للحراسة", value: "شركة الرائد للحراسة" },
        { name: "الدفاع المدني", value: "الدفاع المدني" },
        { name: "كراج ميكانيكي", value: "كراج ميكانيكي" }
      )
    ),
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("تم تسجيل الأوامر ✅");
  } catch (err) {
    console.error("فشل تسجيل الأوامر:", err);
  }
})();

client.on("disconnect", () => {
  console.log("⚠️ انقطع الاتصال، جاري إعادة الاتصال...");
});

client.on("error", (err) => {
  console.error("❌ خطأ في البوت:", err.message);
});

client.once("ready", () => console.log(`البوت جاهز: ${client.user.tag} ✅`));

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  if (commandName === "إعطاء-رتبة") {
    const member = interaction.options.getMember("الشخص");
    const role1 = interaction.options.getRole("role1");
    const role2 = interaction.options.getRole("role2");
    if (!member || !role1) {
      await interaction.reply({ content: "❌ حدث خطأ تواصل مع الإدارة", ephemeral: true });
      return;
    }
    try {
      await member.roles.add(role1.id);
      if (role2) await member.roles.add(role2.id);
      const embed = new EmbedBuilder()
        .setColor("#2ecc71")
        .setTitle("تمت صرف الرتبة")
        .addFields(
          { name: "الشخص", value: `<@${member.id}>`, inline: true },
          { name: "Role1", value: `<@&${role1.id}>`, inline: true },
          ...(role2 ? [{ name: "Role2", value: `<@&${role2.id}>`, inline: true }] : [])
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch {
      await interaction.reply({ content: "❌ حدث خطأ تواصل مع الإدارة", ephemeral: true });
    }
    return;
  }

  if (commandName === "إزالة-رتبة") {
    const member = interaction.options.getMember("الشخص");
    const role1 = interaction.options.getRole("role1");
    const role2 = interaction.options.getRole("role2");
    if (!member || !role1) {
      await interaction.reply({ content: "❌ حدث خطأ تواصل مع الإدارة.", ephemeral: true });
      return;
    }
    try {
      await member.roles.remove(role1.id);
      if (role2) await member.roles.remove(role2.id);
      const embed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setTitle("تمت إزالة الرتبة")
        .addFields(
          { name: "الشخص", value: `<@${member.id}>`, inline: true },
          { name: "Role1", value: `<@&${role1.id}>`, inline: true },
          ...(role2 ? [{ name: "Role2", value: `<@&${role2.id}>`, inline: true }] : [])
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch {
      await interaction.reply({ content: "❌ فشل إزالة الرتبة.", ephemeral: true });
    }
    return;
  }

  if (commandName === "تغيير-اسم") {
    const member = interaction.options.getMember("الشخص");
    const name = interaction.options.getString("الاسم", true);
    if (!member) {
      await interaction.reply({ content: "❌ حدث خطأ تواصل مع الإدارة", ephemeral: true });
      return;
    }
    try {
      await member.setNickname(name);
      await interaction.reply({ content: `✅ تم تغيير الاسم إلى: \`${name}\``, ephemeral: true });
    } catch {
      await interaction.reply({ content: "❌ فشل تغيير الاسم.", ephemeral: true });
    }
    return;
  }

  if (commandName === "إرجاع-الاسم-الأصلي") {
    const member = interaction.options.getMember("الشخص");
    if (!member) {
      await interaction.reply({ content: "❌ حدث خطأ تواصل مع الإدارة", ephemeral: true });
      return;
    }
    try {
      await member.setNickname(null);
      await interaction.reply({ content: `✅ تم إرجاع الاسم الأصلي لـ <@${member.id}>`, ephemeral: true });
    } catch {
      await interaction.reply({ content: "❌ فشل إرجاع الاسم.", ephemeral: true });
    }
    return;
  }

  if (commandName === "توظيف-دفعة") {
    await interaction.deferReply({ ephemeral: true });
    const role1 = interaction.options.getRole("role1", true);
    const leaderRoleId = interaction.options.getString("اعتماد", true);
    try {
      const rows = (await (await fetch(HIRE_SHEET)).text()).split("\n").slice(1);
      const grouped = {};
      for (const rank of RANK_ORDER) grouped[rank] = [];
      for (const row of rows) {
        const cols = row.split(",");
        const id = cols[1]?.trim(), name = cols[2]?.trim(), code = cols[3]?.trim(), rank = cols[4]?.trim();
        if (!id || !rank) continue;
        try {
          const member = await interaction.guild.members.fetch(id);
          await member.roles.add(role1.id);
          if (RANKS[rank]) {
            await member.roles.add(RANKS[rank]);
            grouped[rank].push(`<@${id}>`);
          }
          if (name && code) await member.setNickname(`[${code}] ${name}`);
        } catch {}
      }
      let result = "";
      for (const rank of RANK_ORDER) {
        if (grouped[rank].length) result += `<@&${RANKS[rank]}>\n\n${grouped[rank].join("\n")}\n\n`;
      }
      await interaction.channel.send(
        `**بسم الرحمن الرحيم\n\nنبارك لكم صدور قرار التوظيف من قبل <@&${leaderRoleId}>\n\n${result}\n\`\`\`${decisionCode()}\`\`\`**`
      );
      await interaction.editReply({ content: "✅ تم إرسال قرار التوظيف." });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: "❌ حدث خطأ أثناء التنفيذ." });
    }
    return;
  }

  if (commandName === "ترقيات") {
    await interaction.deferReply({ ephemeral: true });
    const leaderRoleId = interaction.options.getString("اعتماد", true);
    try {
      const rows = (await (await fetch(PROMOTE_SHEET)).text()).split("\n").slice(1);
      const grouped = {};
      for (const rank of RANK_ORDER) grouped[rank] = [];
      for (const row of rows) {
        const cols = row.split(",");
        const id = cols[1]?.trim(), oldRank = cols[4]?.trim(), newRank = cols[5]?.trim();
        if (!id || !newRank) continue;
        try {
          const member = await interaction.guild.members.fetch(id);
          if (oldRank && RANKS[oldRank]) await member.roles.remove(RANKS[oldRank]);
          if (RANKS[newRank]) {
            await member.roles.add(RANKS[newRank]);
            grouped[newRank].push(`<@${id}>`);
          }
        } catch {}
      }
      let result = "";
      for (const rank of RANK_ORDER) {
        if (grouped[rank].length) result += `<@&${RANKS[rank]}>\n\n${grouped[rank].join("\n")}\n\n`;
      }
      await interaction.channel.send(
        `**بسم الرحمن الرحيم\n\nنبارك لكم صدور الترقيات من قبل <@&${leaderRoleId}>\n\n${result}\n\`\`\`${decisionCode()}\`\`\`**`
      );
      await interaction.editReply({ content: "✅ تم إرسال قرار الترقيات." });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: "❌ حدث خطأ أثناء التنفيذ." });
    }
    return;
  }

  if (commandName === "إضافة-سجل-الوظيفي") {
    const member = interaction.options.getMember("الشخص");
    const reason = interaction.options.getString("السبب", true);
    const job = interaction.options.getString("الوظيفة", true);
    if (!member) {
      await interaction.reply({ content: "❌ حدث خطأ تواصل مع الإدارة", ephemeral: true });
      return;
    }
    const embed = new EmbedBuilder()
      .setDescription(
        `**تم اضافة لك سجل في سجلك الوظيفي**\n\nالسجل :\n\`\`\`\n${reason}\n\`\`\`\n\nالوظيفة :\n\`\`\`\n${job}\n\`\`\`\n\n\`\`\`\n${decisionCode()}\n\`\`\`\n\n${new Date().toLocaleString("en-US")}`
      )
      .setColor("#f1c40f");
    try {
      await member.send({ embeds: [embed] });
      await interaction.reply({ content: "✅ تم إرسال السجل الوظيفي عبر رسالة خاصة.", ephemeral: true });
    } catch {
      await interaction.reply({ content: "❌ لايمكن إرسال رسالة خاصة للشخص.", ephemeral: true });
    }
    return;
  }

  if (commandName === "لجنة-الرقابة") {
    const member = interaction.options.getMember("الشخص");
    const oldRank = interaction.options.getString("الرتبة-الحالية", true);
    const job = interaction.options.getString("الوظيفة", true);
    if (!member) {
      await interaction.reply({ content: "❌ حدث خطأ تواصل مع الإدارة", ephemeral: true });
      return;
    }
    const oldIdx = RANK_ORDER.indexOf(oldRank);
    const newRank = oldIdx > 0 ? RANK_ORDER[oldIdx - 1] : null;
    if (!newRank) {
      await interaction.reply({ content: "❌ هذه الرتبة هي الأعلى ولا يمكن الترقية منها.", ephemeral: true });
      return;
    }
    try {
      if (RANKS[oldRank]) await member.roles.remove(RANKS[oldRank]);
      if (RANKS[newRank]) await member.roles.add(RANKS[newRank]);
      const oldRankMention = RANKS[oldRank] ? `<@&${RANKS[oldRank]}>` : oldRank;
      const newRankMention = RANKS[newRank] ? `<@&${RANKS[newRank]}>` : newRank;
      const jobRoleId = JOB_ROLES[job];
      await interaction.channel.send(
        `**بعد مراجعة الجهود المبذولة للمذكور <@${member.id}> قررنا من قبل <@&${COMMITTEE_ROLE}> بما هو آتي :\n\nقبول ترشيحه من رتبة ${oldRankMention} إلى رتبة ${newRankMention}\n\nاعلاك الله على مهامك والأمانة المترتبة على رتبتك الحالية\n\nشكر\n<@&${COMMITTEE_ROLE}>${jobRoleId ? `\n<@&${jobRoleId}>` : ""}\n\n\`\`\`${decisionCode()}\`\`\`**`
      );
      await interaction.reply({ content: "✅ تم إرسال قرار لجنة الرقابة.", ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: "❌ حدث خطأ تواصل مع الإدارة", ephemeral: true });
    }
    return;
  }
});

async function login() {
  try {
    await client.login(TOKEN);
  } catch (err) {
    console.error("❌ فشل تسجيل الدخول، إعادة المحاولة بعد 10 ثواني...", err.message);
    setTimeout(login, 10000);
  }
}

login();
