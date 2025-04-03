import pb from '@/lib/pocketbase'

export async function fetchLimitsWithRelations() {
  try {
    // Fetch limits with expanded relations
    const limits = await pb.collection('limits').getFullList({
      expand: 'device_type,station'
    })

    // Get all device types and stations for reference
    const deviceTypes = await pb.collection('device_types').getFullList()
    const stations = await pb.collection('stations').getFullList({
      expand: 'line'
    })

    return {
      limits: limits.map(record => ({
        id: record.id,
        device_type: record.device_type,
        station: record.station,
        limits_data: record.limits_data
      })),
      deviceTypes: deviceTypes.map(dt => ({
        id: dt.id,
        name: dt.name
      })),
      stations: stations.map(s => ({
        id: s.id,
        name: s.name,
        line: s.expand?.line?.name || s.line
      }))
    }
  } catch (error) {
    console.error('Error fetching limits data:', error)
    throw new Error('Failed to load limits data')
  }
}