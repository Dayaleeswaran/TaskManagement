const { supabase } = require("../utils/supabase");
const path = require("path");

const getBucketName = () => process.env.SUPABASE_BUCKET || "Attachment";

/**
 * Upload a file buffer to Supabase Storage bucket.
 * Matches bucket structure: attachments/projectId/taskId/filename
 * 
 * @param {string} projectId - ID of the project
 * @param {string} taskId - ID of the task
 * @param {object} file - Express/Multer file object
 * @returns {Promise<string>} The storage file path (bucketPath)
 */
const uploadFile = async (projectId, taskId, file) => {
  const bucketName = getBucketName();
  
  // Sanitize file name to prevent path traversal and clean special chars
  const baseName = path.basename(file.originalname);
  const cleanFileName = `${Date.now()}_${baseName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  
  const filePath = `attachments/${projectId}/${taskId}/${cleanFileName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[Supabase Storage] Upload error details:", error);
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  return filePath;
};

/**
 * Delete a file from Supabase Storage bucket.
 * 
 * @param {string} bucketPath - The storage path of the file
 */
const deleteFile = async (bucketPath) => {
  const bucketName = getBucketName();

  const { data, error } = await supabase.storage
    .from(bucketName)
    .remove([bucketPath]);

  if (error) {
    console.error("[Supabase Storage] Delete error details:", error);
    throw new Error(`Supabase file deletion failed: ${error.message}`);
  }

  return data;
};

/**
 * Generate a signed URL for download that expires in 5 minutes (300 seconds).
 * 
 * @param {string} bucketPath - The storage path of the file
 * @returns {Promise<string>} Signed download URL
 */
const generateSignedUrl = async (bucketPath) => {
  const bucketName = getBucketName();

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(bucketPath, 300); // 300 seconds = 5 minutes

  if (error) {
    console.error("[Supabase Storage] Signed URL error details:", error);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }

  return data.signedUrl;
};

module.exports = {
  uploadFile,
  deleteFile,
  generateSignedUrl,
};
