const fs = require("fs");
const path = require("path");

// ✅ Safe delete function
function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ Deleted:", filePath);
    }
  } catch (e) {
    console.warn("⚠️ Failed to delete:", filePath);
  }
}

// ✅ Recursive helper to find and delete uploaded files from any object (like req.body)
function deleteUploadedFiles(data) {
  if (!data) return;

  if (typeof data === "object") {
    for (const key in data) {
      if (typeof data[key] === "string") {
        // ✅ Check if value is a relative upload path
        if (data[key].startsWith("uploads/")) {
          const filePath = path.join(process.cwd(), "public", data[key]);
          safeUnlink(filePath);
        }
      } else if (typeof data[key] === "object") {
        // 🔁 Recursive scan for nested structures
        deleteUploadedFiles(data[key]);
      }
    }
  }
}

module.exports = { deleteUploadedFiles };
