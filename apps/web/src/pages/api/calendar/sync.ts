import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Implement Google Calendar OAuth callback
    // For now, return success
    return res.status(200).json({ 
      success: true, 
      events: [] 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Sync failed' });
  }
}
