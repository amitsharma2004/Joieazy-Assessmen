const supabase = require('../config/supabase');

/**
 * POST /api/submissions/confirm
 * Two-step: 1st call → status='pending', 2nd call → status='confirmed'
 */
const confirmSubmission = async (req, res) => {
  try {
    const { assignment_id, group_id } = req.body;
    if (!assignment_id || !group_id) return res.status(400).json({ error: 'assignment_id and group_id required' });

    // Verify student is in the group
    const { data: mem } = await supabase
      .from('group_members').select('id').eq('group_id', group_id).eq('user_id', req.user.id).single();
    if (!mem) return res.status(403).json({ error: 'You are not a member of this group' });

    // Verify assignment exists
    const { data: assign } = await supabase.from('assignments').select('id').eq('id', assignment_id).single();
    if (!assign) return res.status(404).json({ error: 'Assignment not found' });

    // Check existing submission
    const { data: existing } = await supabase
      .from('submissions').select('*').eq('assignment_id', assignment_id).eq('group_id', group_id).single();

    if (existing) {
      if (existing.status === 'confirmed')
        return res.status(409).json({ error: 'Submission already confirmed', submission: existing });

      // Step 2: pending → confirmed
      const { data: updated, error } = await supabase
        .from('submissions')
        .update({ status: 'confirmed', confirmed_by: req.user.id, confirmed_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select().single();

      if (error) throw error;
      return res.json({ submission: updated, step: 2, message: 'Submission confirmed!' });
    }

    // Step 1: create pending record
    const { data: created, error } = await supabase
      .from('submissions')
      .insert({ assignment_id, group_id, user_id: req.user.id, confirmed_by: req.user.id, status: 'pending' })
      .select().single();

    if (error) throw error;
    return res.status(201).json({
      submission: created, step: 1,
      message: 'First step recorded. Please confirm again to finalise submission.'
    });
  } catch (err) {
    console.error('confirmSubmission:', err.message);
    return res.status(500).json({ error: 'Failed to confirm submission' });
  }
};

/** GET /api/submissions */
const getSubmissions = async (req, res) => {
  try {
    let query = supabase
      .from('submissions')
      .select('*, assignment:assignments(id,title,due_date), group:groups(id,name), confirmer:users!submissions_confirmed_by_fkey(name,email)');

    if (req.query.assignment_id) query = query.eq('assignment_id', req.query.assignment_id);
    if (req.query.group_id)      query = query.eq('group_id', req.query.group_id);

    if (req.user.role === 'student') {
      const { data: mems } = await supabase
        .from('group_members').select('group_id').eq('user_id', req.user.id);
      const gIds = (mems || []).map((m) => m.group_id);
      if (!gIds.length) return res.json([]);
      query = query.in('group_id', gIds);
    }

    const { data, error } = await query.order('confirmed_at', { ascending: false, nullsFirst: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error('getSubmissions:', err.message);
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

/** GET /api/submissions/analytics – Admin summary */
const getAnalytics = async (req, res) => {
  try {
    const { data: assignments, error: ae } = await supabase
      .from('assignments').select('id, title, due_date, assigned_to').order('created_at', { ascending: false });
    if (ae) throw ae;

    const { count: totalGroups } = await supabase.from('groups').select('*', { count: 'exact', head: true });

    const analytics = await Promise.all(assignments.map(async (a) => {
      const { count: confirmed } = await supabase
        .from('submissions').select('*', { count: 'exact', head: true })
        .eq('assignment_id', a.id).eq('status', 'confirmed');
      const { count: pending } = await supabase
        .from('submissions').select('*', { count: 'exact', head: true })
        .eq('assignment_id', a.id).eq('status', 'pending');

      const total = totalGroups || 0;
      return {
        assignment_id:    a.id,
        title:            a.title,
        due_date:         a.due_date,
        assigned_to:      a.assigned_to,
        confirmed_groups: confirmed || 0,
        pending_groups:   pending || 0,
        total_groups:     total,
        completion_rate:  total > 0 ? Math.round(((confirmed || 0) / total) * 100) : 0
      };
    }));

    return res.json(analytics);
  } catch (err) {
    console.error('getAnalytics:', err.message);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = { confirmSubmission, getSubmissions, getAnalytics };
