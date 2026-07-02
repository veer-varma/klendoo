import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { meetingId, slot, visitorName, visitorEmail, mode } = req.body;

  try {
    // Create booking record
    const bookingId = `booking_${Date.now()}`;

    // TODO: Charge x402 payment if applicable
    // TODO: Send confirmation email

    return res.status(200).json({
      success: true,
      bookingId,
      message: 'Booking confirmed',
    });
  } catch (error) {
    console.error('Booking error:', error);
    return res.status(500).json({ error: 'Booking failed' });
  }
}
