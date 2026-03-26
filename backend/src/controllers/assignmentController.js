const supabase = require('../config/supabase');

/** POST /api/assignments – Admin creates assignment */
const createAssignment = async (req, res) => {
  try {
    const { title, description, due_date, onedrive_link, assigned_to = 'all', group_ids = [] } = req.body;
    if (!title || !due_date) return res.status(400).json({ error: 'title and due_date required' });
    if (assigned_to === 'specific' && group_ids.length === 0)
      return res.status(400).json({ error: 'group_ids required for specific assignment' });

    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({ title, description, due_date, onedrive_link, assigned_to, created_by: req.user.id })
      .select()
      .single();

    if (error) throw error;

    // Link specific groups
    if (assigned_to === 'specific' && group_ids.length > 0) {
      const links = group_ids.map((gid) => ({ assignment_id: assignment.id, group_id: gid }));
      const { error: le } = await supabase.from('assignment_groups').insert(links);
      if (le) throw le;
    }

    return res.status(201).json({ assignment });
  } catch (err) {
    console.error('createAssignment:', err.message);
    return res.status(500).json({ error: 'Failed to create assignment' });
  }
};

/** GET /api/assignments – Role-filtered list */
const getAssignments = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, creator:users!assignments_created_by_fkey(name,email), assignment_groups(group_id, groups(id,name))')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Attach submission stats
      const result = await Promise.all(data.map(async (a) => {
        const { count: confirmed } = await supabase
          .from('submissions').select('*', { count: 'exact', head: true })
          .eq('assignment_id', a.id).eq('status', 'confirmed');
        const { count: totalGroups } = await supabase
          .from('groups').select('*', { count: 'exact', head: true });
        return { ...a, stats: { confirmed_groups: confirmed || 0, total_groups: totalGroups || 0 } };
      }));

      return res.json(result);
    }

    // Student: find group memberships
    const { data: mems } = await supabase
      .from('group_members').select('group_id').eq('user_id', req.user.id);
    const groupIds = (mems || []).map((m) => m.group_id);

    // Assignments assigned to 'all'
    const { data: allAssign, error: e1 } = await supabase
      .from('assignments')
      .select('*, creator:users!assignments_created_by_fkey(name)')
      .eq('assigned_to', 'all')
      .order('created_at', { ascending: false });
    if (e1) throw e1;

    let specificAssign = [];
    if (groupIds.length > 0) {
      const { data: agLinks } = await supabase
        .from('assignment_groups').select('assignment_id').in('group_id', groupIds);
      const ids = [...new Set((agLinks || []).map((l) => l.assignment_id))];
      if (ids.length > 0) {
        const { data: sa } = await supabase
          .from('assignments')
          .select('*, creator:users!assignments_created_by_fkey(name)')
          .in('id', ids)
          .order('created_at', { ascending: false });
        specificAssign = sa || [];
      }
    }

    // Deduplicate
    const map = new Map();
    [...(allAssign || []), ...specificAssign].forEach((a) => map.set(a.id, a));
    const merged = Array.from(map.values());

    // Attach group submission status
    const result = await Promise.all(merged.map(async (a) => {
      let groupSubmissions = [];
      if (groupIds.length > 0) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('group_id, status, confirmed_at')
          .eq('assignment_id', a.id)
          .in('group_id', groupIds);
        groupSubmissions = subs || [];
      }
      return { ...a, group_submissions: groupSubmissions };
    }));

    return res.json(result);
  } catch (err) {
    console.error('getAssignments:', err.message);
    return res.status(500).json({ error: 'Failed to fetch assignments' });
  }
};

/** GET /api/assignments/:id */
const getAssignment = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*, creator:users!assignments_created_by_fkey(name,email), assignment_groups(group_id, groups(id,name))')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Assignment not found' });

    // Get submissions with group + confirmer info
    const { data: subs } = await supabase
      .from('submissions')
      .select('*, group:groups(id,name), confirmer:users!submissions_confirmed_by_fkey(name,email)')
      .eq('assignment_id', req.params.id);

    return res.json({ ...data, submissions: subs || [] });
  } catch (err) {
    console.error('getAssignment:', err.message);
    return res.status(500).json({ error: 'Failed to fetch assignment' });
  }
};

/** PUT /api/assignments/:id */
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date, onedrive_link, assigned_to, group_ids } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined)        updates.title = title;
    if (description !== undefined)  updates.description = description;
    if (due_date !== undefined)     updates.due_date = due_date;
    if (onedrive_link !== undefined) updates.onedrive_link = onedrive_link;
    if (assigned_to !== undefined)  updates.assigned_to = assigned_to;

    const { data: updated, error } = await supabase
      .from('assignments').update(updates).eq('id', id).select().single();

    if (error) throw error;

    // Update group links
    if (assigned_to !== undefined) {
      await supabase.from('assignment_groups').delete().eq('assignment_id', id);
      if (assigned_to === 'specific' && group_ids?.length > 0) {
        const links = group_ids.map((gid) => ({ assignment_id: id, group_id: gid }));
        await supabase.from('assignment_groups').insert(links);
      }
    }

    return res.json({ assignment: updated });
  } catch (err) {
    console.error('updateAssignment:', err.message);
    return res.status(500).json({ error: 'Failed to update assignment' });
  }
};

/** DELETE /api/assignments/:id */
const deleteAssignment = async (req, res) => {
  try {
    const { error } = await supabase.from('assignments').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ message: 'Assignment deleted' });
  } catch (err) {
    console.error('deleteAssignment:', err.message);
    return res.status(500).json({ error: 'Failed to delete assignment' });
  }
};

module.exports = { createAssignment, getAssignments, getAssignment, updateAssignment, deleteAssignment };
