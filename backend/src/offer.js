/* Naye member ka offer: jis user ka abhi tak koi paid order nahi, use pehle order pe
   WELCOME_DISCOUNT_PERCENT (default 5%) extra off. Hisaab hamesha server pe. */
const db = require('./db');
const { WELCOME_DISCOUNT_PERCENT } = require('./config');

async function welcomePercent(user) {
  if (!user || !WELCOME_DISCOUNT_PERCENT) return 0;
  const paid = await db.get("SELECT id FROM orders WHERE user_id = ? AND status = 'paid' LIMIT 1", [user.id]);
  return paid ? 0 : WELCOME_DISCOUNT_PERCENT;
}

module.exports = { welcomePercent };
