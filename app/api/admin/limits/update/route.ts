// app/api/admin/limits/update/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pb from '@/lib/pocketbase'

export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, limits_data } = data

    if (!id || !limits_data) {
      return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
      )
    }

    // Basic validation to ensure min is less than max
    for (const test in limits_data) {
      if (limits_data[test].min > limits_data[test].max) {
        return NextResponse.json(
            { error: `Invalid range for test ${test}: min must be less than max` },
            { status: 400 }
        )
      }
    }

    // Update the record
    await pb.collection('limits').update(id, {
      limits_data: limits_data
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating limits:', error)
    return NextResponse.json(
        { error: 'Failed to update limits' },
        { status: 500 }
    )
  }
}