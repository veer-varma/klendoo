// Copyright (c) 2026 Veer Varma. All rights reserved.

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { hostId } = req.query;

      const availableSlots = [
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      ];

      res.status(200).json({
        success: true,
        hostId,
        availableSlots
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
