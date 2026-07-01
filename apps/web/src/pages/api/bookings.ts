// Copyright (c) 2026 Veer Varma. All rights reserved.

import type { NextApiRequest, NextApiResponse } from 'next';
import { SettlementSDK } from '@klendoo/payment-core';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { visitorEmail, visitorName, hostId, preferredTimes, sessionType } = req.body;

      const settlement = new SettlementSDK(process.env.GOPLAUSIBLE_API_KEY);

      const booking = {
        id: `booking-${Date.now()}`,
        visitorEmail,
        visitorName,
        hostId,
        preferredTimes,
        sessionType,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        booking,
        message: 'Booking created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'GET') {
    try {
      const { hostId } = req.query;

      const bookings = [
        {
          id: 'booking-1',
          visitorEmail: 'visitor@example.com',
          visitorName: 'John Doe',
          hostId,
          sessionTime: new Date().toISOString(),
          status: 'confirmed'
        }
      ];

      res.status(200).json({
        success: true,
        bookings
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
