import { MongoClient, Db, Collection } from "mongodb";

let cached: { client: MongoClient; db: Db } | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached) return cached;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = client.db().databaseName || 'test';
  const db = client.db(dbName);
  cached = { client, db };
  return cached;
}

export async function getUsersCollection(): Promise<Collection> {
  const { db } = await connectToDatabase();
  return db.collection('users');
}
