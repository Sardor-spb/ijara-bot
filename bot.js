const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

const BOT_TOKEN = '8434660996:AAGB1YEzvFqDXQbejwUCnlwAxTtzjs5UvSw';
const SUPABASE_URL = 'https://ypfpnxsufpmddifwtrce.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZnBueHN1ZnBtZGRpZnd0cmNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0NDk5MiwiZXhwIjoyMDg5MjIwOTkyfQ.7sSuxETsNafpgWoZzeQLmpijHVt6xJnjO9vdDBaxzQ8';
const MANAGER_CHAT_ID = '7042076197';

const AGENTS = {
  'азиз': '7435209552', 'aziz': '7435209552',
  'бахриддин': '7309753428', 'bahriddin': '7309753428',
  'бехруз': '7829051357', 'bekhruz': '7829051357',
  'асад': '7679936628', 'asad': '7679936628',
  'дэвид': '7272108083', 'david': '7272108083', 'давид': '7272108083',
  'давлат': '6584172190', 'davlat': '6584172190',
  'достон': '8388494905', 'doston': '8388494905',
  'йигит': '8433945844', 'yigit': '8433945844',
  'иброхим': '8427762960', 'ibrokhim': '8427762960',
  'акмал': '7197962850', 'akmal': '7197962850',
  'шахзод': '8508899713', 'shaxzod': '8508899713', 'шахзода': '8508899713',
  'абдуллох': '8455461184', 'abdulloh': '8455461184',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('Ijara Bot запущен...');

function parseField(text, ...keys) {
  for (const key of keys) {
    const regex = new RegExp(key + '[:\\s]+(.+)', 'im');
    const match = text.match(regex);
    if (match) return match[1].trim();
  }
  return null;
}

bot.on('message', async (msg) => {
  const text = msg.text || '';
  const chatId = msg.chat.id;
  const clientName = parseField(text, 'Клиент', 'Client');
  const contacts = parseField(text, 'Контакты', 'Contacts', 'Телефон');
  const budget = parseField(text, 'Бюджет', 'Budget');
  const location = parseField(text, 'Локация', 'Location');
  const apartment = parseField(text, 'Квартира', 'Apartment');
  const period = parseField(text, 'Срок', 'Period');
  const moveIn = parseField(text, 'Дата заселения', 'Заселение');
  const extra = parseField(text, 'Дополнительно', 'Extra');
  const agentName = parseField(text, 'Агент', 'Agent');

  if (!clientName && !contacts) return;

  const agentTgId = agentName ? AGENTS[agentName.toLowerCase().trim()] : null;
  const leadId = 'lead_' + Date.now();

  const { error } = await supabase.from('leads').insert({
    id: leadId,
    client_name: clientName || 'Не указано',
    client_phone: contacts || 'Не указано',
    budget: budget || null,
    district: location || null,
    apartment_type: apartment || null,
    rental_period: period || null,
    move_in_date: moveIn || null,
    additional_info: extra || null,
    agent_name: agentName || null,
    source: 'telegram_bot',
    status: 'new',
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Ошибка:', error.message);
    bot.sendMessage(chatId, 'Ошибка при сохранении лида.');
    return;
  }

  const managerMsg = '*Новый лид!*\n\n' +
    'Клиент: ' + (clientName || '—') + '\n' +
    'Контакты: ' + (contacts || '—') + '\n' +
    'Бюджет: ' + (budget || '—') + '\n' +
    'Локация: ' + (location || '—') + '\n' +
    'Квартира: ' + (apartment || '—') + '\n' +
    'Заселение: ' + (moveIn || '—') + '\n' +
    'Агент: ' + (agentName || '—');

  await bot.sendMessage(MANAGER_CHAT_ID, managerMsg, { parse_mode: 'Markdown' });

  if (agentTgId) {
    const agentMsg = '*Новый лид назначен тебе!*\n\n' +
      'Клиент: ' + (clientName || '—') + '\n' +
      'Контакты: ' + (contacts || '—') + '\n' +
      'Бюджет: ' + (budget || '—') + '\n' +
      'Локация: ' + (location || '—') + '\n\n' +
      'Чек-лист:\n' +
      '1. Позвонить клиенту в течение 15 минут\n' +
      '2. Уточнить детали\n' +
      '3. Подобрать варианты\n' +
      '4. Назначить показ';
    await bot.sendMessage(agentTgId, agentMsg, { parse_mode: 'Markdown' });
  }

  await bot.sendMessage(chatId, 'Лид принят! Агент ' + (agentName || '—') + ' уведомлён.');
});

bot.on('polling_error', (err) => console.error('Polling error:', err.message));
