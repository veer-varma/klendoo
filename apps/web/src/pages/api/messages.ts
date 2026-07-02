// Copyright (c) 2026 Veer Varma. All rights reserved.

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { sessionId, userId, text, userRole } = req.body;

      const message = {
        id: `msg-${Date.now()}`,
        sessionId,
        userId,
        text,
        userRole,
        createdAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        message
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'GET') {
    try {
      const { sessionId } = req.query;

      const messages = [
        {
          id: 'msg-1',
          sessionId,
          userId: 'visitor@example.com',
          text: 'Hi, I\'d like to book a session',
          userRole: 'visitor',
          createdAt: new Date().toISOString()
        }
      ];

      res.status(200).json({
        success: true,
        messages
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
