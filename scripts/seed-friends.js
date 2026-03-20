'use strict';
/**
 * scripts/seed-friends.js
 *
 * Standalone seeding script to insert dummy users, friendships, and friend_requests
 * into a MongoDB used by this project.
 *
 * Usage examples:
 *   MONGODB_URI="mongodb://localhost:27017/friends_dev" npm run seed:friends
 *   SEED_USERS=200 SEED_FRIENDSHIPS=500 SEED_REQUESTS=100 SEED_PASSWORD=myPass npm run seed:friends
 *
 * Environment variables (in precedence / defaults):
 *   MONGODB_URI - full connection string (if present, used as-is)
 *   MONGO_USER - username (used to build URI if MONGODB_URI is not set)
 *   MONGO_PASS - password (used to build URI if MONGODB_URI is not set)
 *   MONGO_HOST - default: localhost
 *   MONGO_PORT - default: 27017
 *   MONGO_DB   - default: test
 *
 * Seeding options:
 *   SEED_USERS - number of users to create (default 100)
 *   SEED_FRIENDSHIPS - number of friendship pairs to create (default 300)
 *   SEED_REQUESTS - number of friend_requests to create (default 50)
 *   SEED_PASSWORD - demo password to hash for all users (default 'password123')
 *   SEED_BCRYPT_ROUNDS - bcrypt rounds for hashing (default 10)
 *
 * Safety notes: do not run this against production databases unless you know what
 * you are doing and have backups/snapshots. The operator is responsible for the
 * target DB selection via environment variables.
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

function buildMongoUri() {
  const full = process.env.MONGODB_URI;
  if (full && full.trim()) return full;
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || '27017';
  const db = process.env.MONGO_DB || 'test';
  if (user && pass) {
    const escUser = encodeURIComponent(user);
    const escPass = encodeURIComponent(pass);
    return `mongodb://${escUser}:${escPass}@${host}:${port}/${db}`;
  }
  return `mongodb://${host}:${port}/${db}`;
}

const NUM_USERS = Number(process.env.SEED_USERS) || 100;
const NUM_FRIENDSHIPS = Number(process.env.SEED_FRIENDSHIPS) || 300;
const NUM_REQUESTS = Number(process.env.SEED_REQUESTS) || 50;
const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'password123';
const BCRYPT_ROUNDS = Number(process.env.SEED_BCRYPT_ROUNDS) || 10;

if (NUM_USERS < 2) {
  console.error('SEED_USERS must be at least 2');
  process.exit(1);
}

function randBetween(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

async function main() {
  const uri = buildMongoUri();
  const client = new MongoClient(uri);
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    // Determine DB name: if MONGODB_URI provided with db, client.db() will have it; otherwise use MONGO_DB or default
    const dbName = process.env.MONGO_DB || client.db().databaseName || 'test';
    const db = client.db(dbName);
    const usersCol = db.collection('users');
    const friendshipsCol = db.collection('friendships');
    const friendRequestsCol = db.collection('friend_requests');

    console.log(`Using DB: ${db.databaseName}`);
    console.log(`Seeding: users=${NUM_USERS}, friendships=${NUM_FRIENDSHIPS}, requests=${NUM_REQUESTS}`);

    // Create users
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const users = [];
    for (let i = 0; i < NUM_USERS; i++) {
      const createdAt = now - Math.floor(Math.random() * thirtyDaysMs);
      const user = {
        email: `user${i + 1}@example.test`,
        provider: 'email',
        providerId: null,
        displayName: `User ${i + 1}`,
        avatarUrl: null,
        createdAt,
        passwordHash: bcrypt.hashSync(DEMO_PASSWORD, BCRYPT_ROUNDS),
        resetTokenHash: null,
        resetTokenExpires: null,
      };
      users.push(user);
    }

    const insertUsersRes = await usersCol.insertMany(users);
    const insertedIdsObj = insertUsersRes.insertedIds || {};
    const usersWithIds = [];
    for (const [idxStr, id] of Object.entries(insertedIdsObj)) {
      const idx = Number(idxStr);
      const original = users[idx];
      usersWithIds.push({ _id: id, createdAt: original.createdAt });
    }

    console.log(`Inserted ${usersWithIds.length} users`);

    // Helper for friendship key (unordered)
    const friendshipKey = (a, b) => {
      const sa = a.toString();
      const sb = b.toString();
      return sa < sb ? `${sa}--${sb}` : `${sb}--${sa}`;
    };

    // Build friendships
    const friendshipSet = new Set();
    const friendshipDocs = [];
    const maxAttempts = Math.max(100 * NUM_FRIENDSHIPS, NUM_FRIENDSHIPS + 1000);
    let attempts = 0;
    while (friendshipDocs.length < NUM_FRIENDSHIPS && attempts < maxAttempts) {
      attempts++;
      const aIndex = Math.floor(Math.random() * usersWithIds.length);
      let bIndex = Math.floor(Math.random() * usersWithIds.length);
      if (aIndex === bIndex) continue; // no self-friendship
      // Ensure distinct
      const a = usersWithIds[aIndex];
      const b = usersWithIds[bIndex];
      const key = friendshipKey(a._id, b._id);
      if (friendshipSet.has(key)) continue;
      // createdAt between the later of the two createdAt and now
      const minTs = Math.max(a.createdAt || 0, b.createdAt || 0);
      const createdAt = randBetween(minTs, Date.now());
      friendshipSet.add(key);
      // store ordered so userId < friendId by string compare for consistency
      const [left, right] = a._id.toString() < b._id.toString() ? [a._id, b._id] : [b._id, a._id];
      friendshipDocs.push({ userId: left, friendId: right, createdAt });
    }

    console.log(`Prepared ${friendshipDocs.length} unique friendships (attempts=${attempts})`);

    // Insert friendships (initial set)
    let insertedFriendshipsCount = 0;
    if (friendshipDocs.length > 0) {
      const res = await friendshipsCol.insertMany(friendshipDocs);
      insertedFriendshipsCount = Object.keys(res.insertedIds || {}).length;
    }

    // Build friend requests
    const requestDocs = [];
    const requestSet = new Set(); // directed keys
    const extraFriendships = [];
    attempts = 0;
    const maxRequestAttempts = Math.max(100 * NUM_REQUESTS, NUM_REQUESTS + 1000);

    while (requestDocs.length < NUM_REQUESTS && attempts < maxRequestAttempts) {
      attempts++;
      const fromIndex = Math.floor(Math.random() * usersWithIds.length);
      let toIndex = Math.floor(Math.random() * usersWithIds.length);
      if (fromIndex === toIndex) continue;
      const from = usersWithIds[fromIndex];
      const to = usersWithIds[toIndex];
      const directedKey = `${from._id.toString()}--${to._id.toString()}`;
      if (requestSet.has(directedKey)) continue;
      // Do not create a request if already friends (unordered)
      const unorderedKey = friendshipKey(from._id, to._id);
      if (friendshipSet.has(unorderedKey)) continue;
      // Build request
      const minTs = Math.max(from.createdAt || 0, to.createdAt || 0);
      const createdAt = randBetween(minTs, Date.now());
      // status distribution: pending 60%, accepted 30%, rejected 10%
      const r = Math.random();
      let status = 'pending';
      if (r < 0.6) status = 'pending';
      else if (r < 0.9) status = 'accepted';
      else status = 'rejected';
      let updatedAt = createdAt;
      if (status !== 'pending') {
        // make updatedAt somewhat later
        updatedAt = randBetween(createdAt, Date.now());
      }
      requestSet.add(directedKey);
      requestDocs.push({ fromId: from._id, toId: to._id, status, createdAt, updatedAt });

      if (status === 'accepted') {
        // ensure friendship exists
        if (!friendshipSet.has(unorderedKey)) {
          friendshipSet.add(unorderedKey);
          const [left, right] = from._id.toString() < to._id.toString() ? [from._id, to._id] : [to._id, from._id];
          const fCreatedAt = randBetween(Math.max(from.createdAt || 0, to.createdAt || 0), Date.now());
          extraFriendships.push({ userId: left, friendId: right, createdAt: fCreatedAt });
        }
      }
    }

    console.log(`Prepared ${requestDocs.length} friend_requests (attempts=${attempts})`);

    // Insert friend requests
    let insertedRequestsCount = 0;
    if (requestDocs.length > 0) {
      const res = await friendRequestsCol.insertMany(requestDocs);
      insertedRequestsCount = Object.keys(res.insertedIds || {}).length;
    }

    // Insert extra friendships (from accepted requests)
    let insertedExtraFriendships = 0;
    if (extraFriendships.length > 0) {
      const res = await friendshipsCol.insertMany(extraFriendships);
      insertedExtraFriendships = Object.keys(res.insertedIds || {}).length;
    }

    const totalFriendshipsInserted = insertedFriendshipsCount + insertedExtraFriendships;

    // Breakdown of request statuses
    const statusCounts = requestDocs.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\nSeeding summary:');
    console.log(`  users inserted: ${usersWithIds.length}`);
    console.log(`  friendships inserted: ${totalFriendshipsInserted} (initial ${insertedFriendshipsCount} + extra from accepted requests ${insertedExtraFriendships})`);
    console.log(`  friend_requests inserted: ${insertedRequestsCount}`);
    console.log(`    - pending: ${statusCounts.pending || 0}`);
    console.log(`    - accepted: ${statusCounts.accepted || 0}`);
    console.log(`    - rejected: ${statusCounts.rejected || 0}`);

    console.log('\nVerification (run in mongosh against the same DB):');
    console.log('  db.users.countDocuments()');
    console.log('  db.friendships.countDocuments()');
    console.log('  db.friend_requests.countDocuments()');

    console.log('\nCheck for orphaned friendship references (friendships pointing to missing users):');
    console.log('  db.friendships.aggregate([');
    console.log("    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u1' } },");
    console.log("    { $lookup: { from: 'users', localField: 'friendId', foreignField: '_id', as: 'u2' } },");
    console.log("    { $match: { $or: [ { u1: { $size: 0 } }, { u2: { $size: 0 } } ] } },");
    console.log("    { $project: { userId: 1, friendId: 1 } }" );
    console.log('  ])');

    console.log('\nExample: find friend requests without corresponding users:');
    console.log('  db.friend_requests.aggregate([');
    console.log("    { $lookup: { from: 'users', localField: 'fromId', foreignField: '_id', as: 'fromUser' } },");
    console.log("    { $lookup: { from: 'users', localField: 'toId', foreignField: '_id', as: 'toUser' } },");
    console.log("    { $match: { $or: [ { fromUser: { $size: 0 } }, { toUser: { $size: 0 } } ] } },");
    console.log("    { $project: { fromId: 1, toId: 1, status: 1 } }" );
    console.log('  ])');

    console.log('\nDone. Database connection will be closed.');
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    try {
      await client.close();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }
}

// Run
main();
