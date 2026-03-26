const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

/** POST /api/auth/register */
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
    if (!['student', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    // Check email exists
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashed, role })
      .select('id, name, email, role')
      .single();

    if (error) throw error;
    return res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    console.error('register:', err.message);
    return res.status(500).json({ error: 'Registration failed' });
  }
};

/** POST /api/auth/login */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, role, password')
      .eq('email', email)
      .single();

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...safe } = user;
    return res.json({ token: signToken(safe), user: safe });
  } catch (err) {
    console.error('login:', err.message);
    return res.status(500).json({ error: 'Login failed' });
  }
};

/** GET /api/auth/me */
const me = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
};

module.exports = { register, login, me };
