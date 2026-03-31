const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { PDFDocument } = require("pdf-lib");

// ------------------------------
// Nested setter
// ------------------------------
function setDeepValue(obj, key, value) {
    const keys = key.replace(/\]/g, "").split(/\.|\[/);
    let current = obj;

    keys.forEach((k, index) => {
        if (index === keys.length - 1) {
            if (k === "") {
                if (!Array.isArray(current)) current = [];
                current.push(value);
            } else {
                current[k] = value;
            }
        } else {
            if (!current[k] || typeof current[k] !== "object") {
                current[k] = isNaN(keys[index + 1]) ? {} : [];
            }
            current = current[k];
        }
    });
}

// ------------------------------
// Multer
// ------------------------------
const upload = multer({ storage: multer.memoryStorage() }).any();

function memoryUpload(folderName = "default") {
    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) return next(err);

            req.tempFiles = [];

            if (req.files && req.files.length > 0) {
                req.files.forEach((file) => {
                    const ext = path.extname(file.originalname);
                    const baseName = `file-${Date.now()}-${Math.round(
                        Math.random() * 99999
                    )}`;

                    let finalPath;

                    // ------------------------------
                    // FORCE .webp for images
                    // ------------------------------
                    if (file.mimetype.startsWith("image/")) {
                        finalPath = `uploads/${folderName}/${baseName}.webp`;
                    } else {
                        // pdf, docx, etc
                        finalPath = `uploads/${folderName}/${baseName}${ext}`;
                    }

                    // Store in DB (correct path)
                    setDeepValue(req.body, file.fieldname, finalPath);

                    req.tempFiles.push({
                        buffer: file.buffer,
                        mimetype: file.mimetype,
                        originalExt: ext,
                        finalPath,
                    });
                });
            }

            next();
        });
    };
}

// ------------------------------
// Save + Compress
// ------------------------------
async function saveRAMFiles(tempFiles) {
    for (const f of tempFiles) {
        const fullPath = path.join(process.cwd(), "public", f.finalPath);

        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        let finalBuffer = f.buffer;

        // IMAGE → compress → webp
        if (f.mimetype.startsWith("image/")) {
            const compressed = await sharp(f.buffer)
                .resize({ width: 1200 })
                .webp({ quality: 60 })
                .toBuffer();

            finalBuffer = compressed;
        }

        // PDF compress
        if (f.mimetype === "application/pdf") {
            const pdfDoc = await PDFDocument.load(f.buffer);
            finalBuffer = await pdfDoc.save({ useObjectStreams: true });
        }

        await fs.promises.writeFile(fullPath, finalBuffer);
    }
}

module.exports = { memoryUpload, saveRAMFiles };
