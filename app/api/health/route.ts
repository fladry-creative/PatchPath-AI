import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Used for container health checks, load balancer probes, and monitoring
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: process.env.COSMOS_ENDPOINT ? 'configured' : 'missing',
        ai: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
        auth: process.env.CLERK_SECRET_KEY ? 'configured' : 'missing',
      },
    },
    { status: 200 }
  );
}
