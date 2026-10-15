// DB queries for auth module

export const findUserByFirebaseUid = async (fastify, firebaseUid) => {
  const { rows } = await fastify.db.query(
    "SELECT * FROM users WHERE firebase_uid = $1 AND deleted_at IS NULL",
    [firebaseUid],
  );
  return rows[0] || null;
};

export const findUserById = async (fastify, userId) => {
  const { rows } = await fastify.db.query(
    "SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL",
    [userId],
  );
  return rows[0] || null;
};

export const findUserByPhoneHmac = async (fastify, phoneHmac) => {
  const { rows } = await fastify.db.query(
    "SELECT * FROM users WHERE phone_lookup_hmac = $1 AND deleted_at IS NULL",
    [phoneHmac],
  );
  return rows[0] || null;
};

export const createUser = async (fastify, userData) => {
  const {
    firebaseUid,
    phoneEncrypted,
    phoneHmac,
    fullName = null,
    email = null,
  } = userData;

  const { rows } = await fastify.db.query(
    `INSERT INTO users (
       firebase_uid, phone_e164_encrypted, phone_lookup_hmac,
       full_name, email
     ) VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [firebaseUid, phoneEncrypted, phoneHmac, fullName, email],
  );
  return rows[0];
};

export const createDefaultSettings = async (fastify, userId) => {
  await fastify.db.query(
    "INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING",
    [userId],
  );
};

export const updateUserProfile = async (
  fastify,
  userId,
  { full_name, email },
) => {
  const { rows } = await fastify.db.query(
    `UPDATE users
     SET full_name = COALESCE($2, full_name),
         email = COALESCE($3, email),
         profile_completed_at = COALESCE(profile_completed_at, NOW()),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [userId, full_name || null, email || null],
  );
  return rows[0];
};

export const updateUserRole = async (fastify, userId, role) => {
  const { rows } = await fastify.db.query(
    `UPDATE users
     SET active_role = $2,
         default_role = $2,
         last_role_switched_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [userId, role],
  );
  return rows[0];
};

export const findUserWithSettings = async (fastify, userId) => {
  const { rows } = await fastify.db.query(
    `SELECT u.*, 
            row_to_json(s) as settings
     FROM users u
     LEFT JOIN user_settings s ON s.user_id = u.id
     WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [userId],
  );
  return rows[0] || null;
};
