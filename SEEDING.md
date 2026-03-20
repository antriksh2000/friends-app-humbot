# SEEDING

This repository includes a standalone seeder script to populate a MongoDB database with dummy users, friendships, and friend_requests for local development and testing.

Purpose
- Quickly create realistic test data (users, friendships, friend requests) for development or QA environments.

Safety / Preconditions
- Do NOT run this against production unless you fully understand the consequences and have an up-to-date backup/snapshot of your database.
- The operator chooses the target DB by environment variables — ensure you point to a development/test DB.

Environment variables
- MONGODB_URI - full connection string (if present, used as-is)
- MONGO_USER - username (used to build URI if MONGODB_URI is not set)
- MONGO_PASS - password (used to build URI if MONGODB_URI is not set)
- MONGO_HOST - default: localhost
- MONGO_PORT - default: 27017
- MONGO_DB   - default: test

Seeding options
- SEED_USERS - number of users to create (default 100)
- SEED_FRIENDSHIPS - number of friendship pairs to create (default 300)
- SEED_REQUESTS - number of friend_requests to create (default 50)
- SEED_PASSWORD - demo password used for all users (default 'password123')
- SEED_BCRYPT_ROUNDS - bcrypt rounds for hashing (default 10)

NPM script
- Run via the included npm script:

  MONGODB_URI="mongodb://localhost:27017/friends_dev" npm run seed:friends

- Or set options inline:

  SEED_USERS=200 SEED_FRIENDSHIPS=500 npm run seed:friends

Notes
- If MONGODB_URI is provided it will be used directly. Otherwise the script will build a URI from MONGO_USER, MONGO_PASS, MONGO_HOST, MONGO_PORT and MONGO_DB.
- Collections used: `users`, `friendships`, `friend_requests`. Inserting documents will create collections if they do not exist.

Verification (mongosh / mongo shell syntax)
- Count documents:

  db.users.countDocuments()
  db.friendships.countDocuments()
  db.friend_requests.countDocuments()

- Find orphaned friendships (friendship referring to missing users):

  db.friendships.aggregate([
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u1' } },
    { $lookup: { from: 'users', localField: 'friendId', foreignField: '_id', as: 'u2' } },
    { $match: { $or: [ { u1: { $size: 0 } }, { u2: { $size: 0 } } ] } },
    { $project: { userId: 1, friendId: 1 } }
  ])

- Find friend_requests that refer to missing users:

  db.friend_requests.aggregate([
    { $lookup: { from: 'users', localField: 'fromId', foreignField: '_id', as: 'fromUser' } },
    { $lookup: { from: 'users', localField: 'toId', foreignField: '_id', as: 'toUser' } },
    { $match: { $or: [ { fromUser: { $size: 0 } }, { toUser: { $size: 0 } } ] } },
    { $project: { fromId: 1, toId: 1, status: 1 } }
  ])

Expected results
- After running the seeder with defaults you should see ~100 users, ~300 friendships, and ~50 friend_requests (actual counts depend on generation limits and duplicates avoidance). Accepted friend_requests will result in an additional friendship if one did not already exist.

Troubleshooting
- If the script fails to connect, ensure your MongoDB is reachable and your environment variables are correct.
- If bcrypt or mongodb packages are missing, install: npm install bcryptjs mongodb
- Ensure SEED_USERS is at least 2.

License / Responsibility
- This script is provided for development/testing convenience. The repository owner / operator is responsible for where and how the script is executed.