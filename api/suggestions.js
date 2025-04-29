import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const dbName = "globalitems";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { name, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing 'name'" });
    }

    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection("items");

      // Versuche das Item zu erhöhen oder anzulegen
      const result = await collection.updateOne(
        { name: name },
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
      console.error("MongoDB Error:", error);
      return res.status(500).json({ error: "Database error" });
    } finally {
      await client.close();
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
