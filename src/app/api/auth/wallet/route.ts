import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * API Route: POST /api/auth/wallet
 * 
 * Generates a signed JWT token for wallet-based authentication with Supabase.
 * This token is used by RLS policies to verify the user's identity.
 */
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    // Validate wallet address
    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Validate address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/i.test(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Get Supabase JWT secret from environment
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      console.error('SUPABASE_JWT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create JWT payload with wallet address
    // This matches what your RLS policies expect: auth.jwt() ->> 'address'
    const payload = {
      address: address.toLowerCase(),
      role: 'authenticated', // Required by Supabase
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    };

    // Sign the JWT with Supabase's secret
    const token = jwt.sign(payload, jwtSecret, {
      algorithm: 'HS256',
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating wallet auth token:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication token' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONAL: Add signature verification for production security
 * 
 * To verify wallet ownership before issuing tokens:
 * 
 * 1. Client signs a message with their wallet
 * 2. Send { address, signature, message } to this endpoint
 * 3. Verify signature using ethers.js:
 * 
 * import { ethers } from 'ethers';
 * 
 * const recoveredAddress = ethers.utils.verifyMessage(message, signature);
 * if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
 *   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
 * }
 * 
 * This prevents users from impersonating other wallet addresses.
 */