import fs from "fs";
import path from "path";

const audioDir = path.join(process.cwd(), "audios");

// Create the folder if it doesn't exist
if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

/**
 * Deletes all files in the audios directory
 */
export const clearAudios = () => {
    const files = fs.readdirSync(audioDir);
    for (const file of files) {
        fs.unlinkSync(path.join(audioDir, file));
    }
    console.log("🗑️ Audio folder cleared.");
};

/**
 * Saves audio buffer to a file
 * @returns the relative path for the frontend to use
 */
export const saveAudio = (buffer, fileName) => {
    const filePath = path.join(audioDir, fileName);
    fs.writeFileSync(filePath, buffer);
    return `audios/${fileName}`;
};