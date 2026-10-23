// Hide users who blocked me or whom I blocked ($1 must be the owner id)
const NOT_BLOCKED = `
  NOT EXISTS (
    SELECT 1 FROM blocks b
     WHERE (b.blocker_id = $1 AND b.blocked_id = u.id)
        OR (b.blocker_id = u.id AND b.blocked_id = $1)
  )`;

// hexes = array of hex strings of phone_lookup_hmac values
export const upsertContacts = async (fastify, ownerId, hexes) => {
  await fastify.db.query(
    `INSERT INTO user_contacts (owner_id, phone_lookup_hmac)
     SELECT $1, decode(h, 'hex')
       FROM unnest($2::text[]) AS h
      WHERE decode(h, 'hex') IS DISTINCT FROM
            (SELECT phone_lookup_hmac FROM users WHERE id = $1)
     ON CONFLICT (owner_id, phone_lookup_hmac)
     DO UPDATE SET synced_at = NOW()`,
    [ownerId, hexes],
  );
};

// Link this owner's unmatched contacts to registered, active users
export const linkMatches = async (fastify, ownerId) => {
  await fastify.db.query(
    `UPDATE user_contacts uc
        SET matched_user_id = u.id
       FROM users u
      WHERE uc.owner_id = $1
        AND uc.matched_user_id IS NULL
        AND uc.phone_lookup_hmac = u.phone_lookup_hmac
        AND u.status = 'active'
        AND u.deleted_at IS NULL
        AND u.id <> $1`,
    [ownerId],
  );
};

export const touchContactsSynced = async (fastify, userId) => {
  await fastify.db.query(
    "UPDATE users SET contacts_synced_at = NOW() WHERE id = $1",
    [userId],
  );
};

// Matches from the batch just uploaded
export const findMatchesByHexes = async (fastify, ownerId, hexes) => {
  const { rows } = await fastify.db.query(
    `SELECT u.id, u.full_name, u.avatar_url
       FROM user_contacts uc
       JOIN users u ON u.id = uc.matched_user_id
      WHERE uc.owner_id = $1
        AND uc.is_hidden = false
        AND u.status = 'active'
        AND u.deleted_at IS NULL
        AND encode(uc.phone_lookup_hmac, 'hex') = ANY($2::text[])
        AND ${NOT_BLOCKED}`,
    [ownerId, hexes],
  );
  return rows;
};

export const findTrusted = async (fastify, ownerId) => {
  const { rows } = await fastify.db.query(
    `SELECT u.id, u.full_name, u.avatar_url, u.active_role, uc.relation_degree
       FROM user_contacts uc
       JOIN users u ON u.id = uc.matched_user_id
      WHERE uc.owner_id = $1
        AND uc.is_hidden = false
        AND u.status = 'active'
        AND u.deleted_at IS NULL
        AND ${NOT_BLOCKED}
      ORDER BY u.full_name NULLS LAST`,
    [ownerId],
  );
  return rows;
};

export const setHidden = async (fastify, ownerId, matchedUserId, hidden) => {
  const { rowCount } = await fastify.db.query(
    `UPDATE user_contacts
        SET is_hidden = $3
      WHERE owner_id = $1 AND matched_user_id = $2`,
    [ownerId, matchedUserId, hidden],
  );
  return rowCount;
};

export const deleteAllContacts = async (fastify, ownerId) => {
  await fastify.db.query("DELETE FROM user_contacts WHERE owner_id = $1", [
    ownerId,
  ]);
  await fastify.db.query(
    "UPDATE users SET contacts_synced_at = NULL WHERE id = $1",
    [ownerId],
  );
};

// Called at signup: link everyone who already had this user's number synced
export const linkExistingContacts = async (fastify, userId) => {
  await fastify.db.query(
    `UPDATE user_contacts uc
        SET matched_user_id = u.id
       FROM users u
      WHERE u.id = $1
        AND uc.phone_lookup_hmac = u.phone_lookup_hmac
        AND uc.matched_user_id IS NULL
        AND uc.owner_id <> u.id`,
    [userId],
  );
};
