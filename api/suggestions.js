import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = "globalitems";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection("items");

      const results = await collection
        .find({ name: { $regex: query, $options: "i" } })
        .sort({ count: -1 })
        .limit(10)
        .toArray();

      return res.status(200).json(results);
    } catch (error) {
      console.error("MongoDB Error (GET):", error);
      return res.status(500).json({ error: "Database error (GET)" });
    } finally {
      await client.close();
    }
  }

  if (req.method === "POST") {
    const { name, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing 'name'" });
    }

    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection("items");

      const result = await collection.updateOne(
        { name },
        {
          $setOnInsert: {
            name,
            category: category || null,
            createdAt: new Date()
          },
          $inc: { count: 1 }
        },
        { upsert: true }
      );

      return res.status(200).json({ success: true, upserted: result.upsertedCount > 0 });
    } catch (error) {
      console.error("MongoDB Error (POST):", error);
      return res.status(500).json({ error: "Database error (POST)" });
    } finally {
      await client.close();
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
