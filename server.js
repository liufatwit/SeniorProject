const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors"); // Import the cors package

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = 5501;
app.use(cors({ origin: "http://localhost:5500" }));

const db = new sqlite3.Database("groups_data.db", (err) => {
  if (err) {
    console.error("Failed to connect to the database:", err.message);
  } else {
    console.log("Connected to the groups_data.db SQLite database.");
  }
});

// Create the groups table
db.run(
  "CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY, group_name TEXT NOT NULL, max_players INTEGER NOT NULL, description TEXT NOT NULL);",
  (err) => {
    if (err) {
      return console.error(err.message);
    }
  }
);
db.run(
  "CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY, tag_name TEXT NOT NULL);",
  (err) => {
    if (err) {
      return console.error(err.message);
    }
  }
);

db.run(
  "CREATE TABLE IF NOT EXISTS group_tags (group_id INTEGER NOT NULL, tag_id INTEGER NOT NULL, FOREIGN KEY (group_id) REFERENCES groups (id) ON DELETE CASCADE, FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE);",
  (err) => {
    if (err) {
      return console.error(err.message);
    }
  }
);
app.post("/createGroup", (req, res) => {
  const { group_name, max_players, description, tags } = req.body;

  if (!group_name || !max_players || !description || !tags) {
    res.status(400).send("Missing required fields.");
    return;
  }

  const sql = `INSERT INTO groups (group_name, max_players, description) VALUES (?, ?, ?)`;
  db.run(sql, [group_name, max_players, description], function (err) {
    if (err) {
      console.error("Error creating group:", err.message);
      res.status(500).send("Failed to create group. Please try again.");
    } else {
      const groupId = this.lastID; // Get the ID of the newly inserted group

      // Insert tags into the tags table if they don't exist yet
      tags.forEach((tag) => {
        db.run(
          "INSERT OR IGNORE INTO tags (tag_name) VALUES (?)",
          [tag.trim()],
          function (err) {
            if (err) {
              console.error("Error inserting tag:", err.message);
            } else {
              const tagId = this.lastID; // Get the ID of the inserted tag

              // Insert the relationship into the group_tags table
              db.run(
                "INSERT INTO group_tags (group_id, tag_id) VALUES (?, ?)",
                [groupId, tagId],
                function (err) {
                  if (err) {
                    console.error(
                      "Error creating group tag relationship:",
                      err.message
                    );
                  }
                }
              );
            }
          }
        );
      });

      res.status(200).send("Group created successfully.");
    }
  });
});

app.get("/listGroups", (req, res) => {
  const sql = `
    SELECT groups.*, GROUP_CONCAT(tags.tag_name) AS tags
    FROM groups
    LEFT JOIN group_tags ON groups.id = group_tags.group_id
    LEFT JOIN tags ON group_tags.tag_id = tags.id
    GROUP BY groups.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Failed to fetch groups. Please try again.");
    } else {
      res.status(200).json(rows);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log("Server is running on http://localhost:5501");
});
