const { MongoClient } = require("mongodb");

module.exports = async (req, res) => {
  const query = req.query.query || "";
  if (!query || query.length < 2) {
    return res.status(400).json({ error: "Query zu kurz oder fehlt." });
  }

  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const collection = client.db("sofio").collection("globalitems");
    const results = await collection
      .find({ name: { $regex: query, $options: "i" } })
      .limit(10)
      .toArray();
    res.status(200).json(results);
  } catch (error) {
    console.error("Fehler bei der Datenbankverbindung:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  } finally {
    await client.close();
  }
};
