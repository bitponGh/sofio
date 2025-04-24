import { MongoClient } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { name, category } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Feld 'name' fehlt oder ist ungültig" });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return res.status(500).json({ error: "MONGODB_URI ist nicht gesetzt" });
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db("findventory").collection("globalItems");

    // Prüfen, ob ein Item mit gleichem Namen existiert (case-insensitive)
    const exists = await collection.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
    if (exists) {
      return res.status(409).json({ error: "Item existiert bereits" });
    }

    const result = await collection.insertOne({
      name,
      category: category || null,
      createdAt: new Date()
    });

    res.status(200).json({ success: true, id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Fehler bei der Datenbankverbindung", details: err.message });
  } finally {
    await client.close();
  }
}
