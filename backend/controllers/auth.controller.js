const { verifyPassword, signToken } = require('../services/auth.service');
const { findAccountByUsername, touchLastLogin } = require('../services/user.service');

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const account = await findAccountByUsername(username);

  // Deliberately identical error for "no such user" and "wrong password" —
  // don't leak which one it was.
  if (!account || !account.is_active) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const passwordOk = await verifyPassword(password, account.password_hash);
  if (!passwordOk) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = signToken({
    userId: account.user_id,
    personId: account.person_id,
    role: account.role_name,
    username: account.username,
  });

  await touchLastLogin(account.user_id);

  res.json({
    token,
    user: {
      userId: account.user_id,
      personId: account.person_id,
      username: account.username,
      role: account.role_name,
      firstName: account.first_name,
      lastName: account.last_name,
    },
  });
}

module.exports = { login };
