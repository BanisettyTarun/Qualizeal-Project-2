const express = require("express");
const xlsx = require("xlsx");
const cors = require("cors");
const app = express();

app.use(cors()); // Enable CORS for frontend requests

// Route to fetch Excel data
app.get("/api/data", (req, res) => {
  // Read the Excel file
  const workbook = xlsx.readFile("C:/Users/91814/Desktop/Book1.xlsx"); // Replace 'data.xlsx' with your file path
  const sheetName = workbook.SheetNames[0]; // Assuming first sheet
  const worksheet = workbook.Sheets[sheetName];

  // Convert worksheet to JSON
  const jsonData = xlsx.utils.sheet_to_json(worksheet);

  // Send the JSON data to the frontend
  res.json(jsonData);
});

// Start the server
const PORT = 3010;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
