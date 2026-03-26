const supabase = require('../config/supabase');

/** POST /api/groups */
const createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name is required' });

    const { data: group, error } = await supabase
      .from('groups').insert({ name, created_by: req.user.id }).select().single();
    if (error) throw error;

    // Auto-add creator as member
    await supabase.from('group_members').insert({ group_id: group.id, user_id: req.user.id });

    return res.status(201).json({ group });
  } catch (err) {
    console.error('createGroup:', err.message);
    return res.status(500).json({ error: 'Failed to create group' });
  }
};

/** GET /api/groups */
const getGroups = async (req, res) => {
  try {
    let query = supabase
      .from('groups')
      .select('*, creator:users!groups_created_by_fkey(name,email), group_members(user_id, users(id,name,email))')
      .order('created_at', { ascending: false });

    if (req.user.role === 'student') {
      const { data: mems } = await supabase
        .from('group_members').select('group_id').eq('user_id', req.user.id);
      const gIds = (mems || []).map((m) => m.group_id);
      if (!gIds.length) return res.json([]);
      query = query.in('id', gIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error('getGroups:', err.message);
    return res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

/** POST /api/groups/:id/members */
const addMember = async (req, res) => {
  try {
    const { id: group_id } = req.params;
    const { email, user_id } = req.body;
    if (!email && !user_id) return res.status(400).json({ error: 'Provide email or user_id' });

    const { data: grp } = await supabase.from('groups').select('created_by').eq('id', group_id).single();
    if (!grp) return res.status(404).json({ error: 'Group not found' });
    if (grp.created_by !== req.user.id) return res.status(403).json({ error: 'Only group creator can add members' });

    const { data: target } = email
      ? await supabase.from('users').select('id,name,email,role').eq('email', email).single()
      : await supabase.from('users').select('id,name,email,role').eq('id', user_id).single();

    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.role !== 'student') return res.status(400).json({ error: 'Only students can be added' });

    const { data: existing } = await supabase
      .from('group_members').select('id').eq('group_id', group_id).eq('user_id', target.id).single();
    if (existing) return res.status(409).json({ error: 'User already a member' });

    const { error } = await supabase.from('group_members').insert({ group_id, user_id: target.id });
    if (error) throw error;

    return res.status(201).json({ message: `${target.name} added`, user: target });
  } catch (err) {
    console.error('addMember:', err.message);
    return res.status(500).json({ error: 'Failed to add member' });
  }
};

/** DELETE /api/groups/:id/members/:userId */
const removeMember = async (req, res) => {
  try {
    const { id: group_id, userId } = req.params;
    const { data: grp } = await supabase.from('groups').select('created_by').eq('id', group_id).single();
    if (!grp) return res.status(404).json({ error: 'Group not found' });
    if (grp.created_by !== req.user.id) return res.status(403).json({ error: 'Only creator can remove members' });
    if (userId === req.user.id) return res.status(400).json({ error: 'Creator cannot remove themselves' });

    await supabase.from('group_members').delete().eq('group_id', group_id).eq('user_id', userId);
    return res.json({ message: 'Member removed' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove member' });
  }
};

module.exports = { createGroup, getGroups, addMember, removeMember };
