import db from '../database/index.js';

export class DepartmentService {
  getAllDepartments() {
    return db.prepare('SELECT * FROM departments WHERE active = 1 ORDER BY name ASC').all();
  }

  getDepartment(id) {
    return db.prepare('SELECT * FROM departments WHERE id = ?').get(id);
  }

  createDepartment({ id, name, description, roleId = null, reviewerRoleId = null, leaderId = null, leaderTag = null, questions = [] }) {
    const cleanId = id.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const existing = this.getDepartment(cleanId);
    if (existing) {
      return { success: false, error: `Department with ID '${cleanId}' already exists.` };
    }

    const now = Date.now();
    db.prepare(`
      INSERT INTO departments (id, name, description, role_id, reviewer_role_id, leader_id, leader_tag, questions_json, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      cleanId,
      name,
      description || 'West Virginia Roleplay Whitelisted Department',
      roleId,
      reviewerRoleId,
      leaderId,
      leaderTag,
      JSON.stringify(questions),
      now
    );

    return { success: true, department: this.getDepartment(cleanId) };
  }

  editDepartment(id, updates = {}) {
    const dept = this.getDepartment(id);
    if (!dept) return { success: false, error: 'Department not found' };

    const name = updates.name !== undefined ? updates.name : dept.name;
    const description = updates.description !== undefined ? updates.description : dept.description;
    const leaderId = updates.leaderId !== undefined ? updates.leaderId : dept.leader_id;
    const leaderTag = updates.leaderTag !== undefined ? updates.leaderTag : dept.leader_tag;
    const questionsJson = updates.questions ? JSON.stringify(updates.questions) : dept.questions_json;

    db.prepare(`
      UPDATE departments
      SET name = ?, description = ?, leader_id = ?, leader_tag = ?, questions_json = ?
      WHERE id = ?
    `).run(name, description, leaderId, leaderTag, questionsJson, id);

    return { success: true, department: this.getDepartment(id) };
  }

  deleteDepartment(id) {
    const dept = this.getDepartment(id);
    if (!dept) return { success: false, error: 'Department not found' };

    db.transaction(() => {
      db.prepare('DELETE FROM departments WHERE id = ?').run(id);
      db.prepare('DELETE FROM department_members WHERE department_id = ?').run(id);
      db.prepare('DELETE FROM chain_of_command WHERE department_id = ?').run(id);
    })();

    return { success: true };
  }

  getRoster(departmentId) {
    return db.prepare(`
      SELECT * FROM department_members
      WHERE department_id = ? AND status = 'ACTIVE'
      ORDER BY id ASC
    `).all(departmentId);
  }

  addMemberToRoster(departmentId, user, rank = 'Probationary Officer', callsign = 'N/A') {
    const existing = db.prepare('SELECT * FROM department_members WHERE department_id = ? AND user_id = ?').get(departmentId, user.id);
    if (existing) {
      db.prepare(`
        UPDATE department_members
        SET rank = ?, callsign = ?, status = 'ACTIVE'
        WHERE id = ?
      `).run(rank, callsign, existing.id);
      return { success: true, updated: true };
    }

    db.prepare(`
      INSERT INTO department_members (department_id, user_id, user_tag, rank, callsign, status, joined_at)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?)
    `).run(departmentId, user.id, user.tag || user.username, rank, callsign, Date.now());

    return { success: true, created: true };
  }

  removeMemberFromRoster(departmentId, userId) {
    db.prepare(`
      UPDATE department_members
      SET status = 'REMOVED'
      WHERE department_id = ? AND user_id = ?
    `).run(departmentId, userId);
    return { success: true };
  }

  getChainOfCommand(departmentId = 'general') {
    return db.prepare(`
      SELECT * FROM chain_of_command
      WHERE department_id = ? OR department_id = 'general'
      ORDER BY rank_order ASC
    `).all(departmentId);
  }

  getFullChainOfCommand() {
    return db.prepare('SELECT * FROM chain_of_command ORDER BY rank_order ASC').all();
  }

  setChainOfCommandRank({ departmentId = 'general', rankName, rankOrder, userId, userTag, positionTitle, isLeadership = 0 }) {
    db.prepare(`
      INSERT INTO chain_of_command (department_id, rank_name, rank_order, user_id, user_tag, position_title, is_leadership, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(departmentId, rankName, rankOrder, userId, userTag, positionTitle, isLeadership ? 1 : 0, Date.now());
    return { success: true };
  }
}

export const departmentService = new DepartmentService();
export default departmentService;
