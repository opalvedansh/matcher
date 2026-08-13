const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env for uploads.");
    }
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Needs to be the service role key to generate signed upload URLs
    );
  }
  return supabase;
}

/**
 * POST /api/upload/presigned-url
 * Body: { filename: string, contentType: string }
 */
async function generatePresignedUrl(req, res, next) {
  try {
    const { filename, contentType } = req.body;
    const { id: userId } = req.user;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType are required' });
    }

    // Only allow safe image types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type. Only JPEG, PNG, WEBP allowed.' });
    }

    // Generate a unique path: e.g. avatars/user-123/uuid-filename.jpg
    const ext = filename.split('.').pop() || 'jpg';
    const filePath = `uploads/${userId}/${uuidv4()}.${ext}`;

    // Note: In Supabase, creating a presigned *upload* URL requires the bucket name and the path.
    // The bucket 'public' must exist in the Supabase project.
    // Ensure bucket exists. We catch errors silently if it already exists.
    const client = getSupabaseClient();
    await client.storage.createBucket('public', { public: true }).catch(() => {});

    const { data, error } = await client
      .storage
      .from('public')
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('[Upload] Supabase error:', error);
      return res.status(500).json({ error: `Failed to generate upload URL: ${error.message || JSON.stringify(error)}` });
    }

    // Return the signed URL and the final public URL where the image will be accessible
    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/public/${filePath}`;

    res.json({
      signedUrl: data.signedUrl,
      path: filePath,
      token: data.token,
      publicUrl
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { generatePresignedUrl };
