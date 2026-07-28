import FloorMapClient from './FloorMapClient'
import { getFloors } from '@/app/lib/actions'
import { resources } from '@/app/lib/resources'
import { prisma } from '@/app/lib/prisma'

export default async function MapPage() {
  const [floors, assetTypes] = await Promise.all([
    getFloors(),
    prisma.assetType.findMany({
      orderBy: { name: 'asc' }
    })
  ])

  return <FloorMapClient floors={floors} resources={resources} assetTypes={assetTypes} />
}
