import AssetPanelClient from './AssetPanelClient'
import { prisma } from '@/app/lib/prisma'
import { getAllAssets } from '@/app/lib/actions'

export default async function AssetsPage() {
  const [assetTypes, createdAssets] = await Promise.all([
    prisma.assetType.findMany({
      orderBy: { name: 'asc' }
    }),
    getAllAssets()
  ])

  return (
    <AssetPanelClient 
      assetTypes={assetTypes}
      createdAssets={createdAssets}
    />
  )
}
