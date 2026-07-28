import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const assetTypesData = [
  {
    name: 'Chair',
    svgData: JSON.stringify({
      type: 'chair',
      elements: [
        {
          type: 'rect',
          x: -15,
          y: -15,
          width: 30,
          height: 30,
          fill: '#8B4513',
          stroke: '#654321',
          strokeWidth: 2,
          rx: 3
        },
        {
          type: 'rect',
          x: -15,
          y: -20,
          width: 30,
          height: 5,
          fill: '#8B4513',
          stroke: '#654321',
          strokeWidth: 2
        }
      ]
    })
  },
  {
    name: 'Desk',
    svgData: JSON.stringify({
      type: 'desk',
      elements: [
        {
          type: 'rect',
          x: -50,
          y: -30,
          width: 100,
          height: 60,
          fill: '#8B7355',
          stroke: '#654321',
          strokeWidth: 2,
          rx: 4
        },
        {
          type: 'rect',
          x: -45,
          y: -25,
          width: 35,
          height: 20,
          fill: '#A0826D',
          stroke: '#654321',
          strokeWidth: 1
        }
      ]
    })
  },
  {
    name: 'Table',
    svgData: JSON.stringify({
      type: 'table',
      elements: [
        {
          type: 'rect',
          x: -60,
          y: -40,
          width: 120,
          height: 80,
          fill: '#D2691E',
          stroke: '#8B4513',
          strokeWidth: 2,
          rx: 5
        },
        {
          type: 'circle',
          cx: -40,
          cy: -20,
          r: 3,
          fill: '#8B4513'
        },
        {
          type: 'circle',
          cx: 40,
          cy: -20,
          r: 3,
          fill: '#8B4513'
        },
        {
          type: 'circle',
          cx: -40,
          cy: 20,
          r: 3,
          fill: '#8B4513'
        },
        {
          type: 'circle',
          cx: 40,
          cy: 20,
          r: 3,
          fill: '#8B4513'
        }
      ]
    })
  },
  {
    name: 'Cabinet',
    svgData: JSON.stringify({
      type: 'cabinet',
      elements: [
        {
          type: 'rect',
          x: -25,
          y: -35,
          width: 50,
          height: 70,
          fill: '#696969',
          stroke: '#404040',
          strokeWidth: 2,
          rx: 3
        },
        {
          type: 'line',
          x1: -25,
          y1: 0,
          x2: 25,
          y2: 0,
          stroke: '#404040',
          strokeWidth: 2
        },
        {
          type: 'circle',
          cx: 15,
          cy: -17,
          r: 3,
          fill: '#C0C0C0'
        },
        {
          type: 'circle',
          cx: 15,
          cy: 17,
          r: 3,
          fill: '#C0C0C0'
        }
      ]
    })
  },
  {
    name: 'Plant',
    svgData: JSON.stringify({
      type: 'plant',
      elements: [
        {
          type: 'rect',
          x: -15,
          y: 10,
          width: 30,
          height: 20,
          fill: '#8B4513',
          stroke: '#654321',
          strokeWidth: 1
        },
        {
          type: 'circle',
          cx: 0,
          cy: 0,
          r: 20,
          fill: '#228B22',
          stroke: '#006400',
          strokeWidth: 2
        },
        {
          type: 'circle',
          cx: -8,
          cy: -5,
          r: 10,
          fill: '#32CD32',
          opacity: 0.7
        },
        {
          type: 'circle',
          cx: 8,
          cy: -5,
          r: 10,
          fill: '#32CD32',
          opacity: 0.7
        },
        {
          type: 'circle',
          cx: 0,
          cy: -12,
          r: 8,
          fill: '#90EE90',
          opacity: 0.6
        }
      ]
    })
  },
  {
    name: 'Door',
    svgData: JSON.stringify({
      type: 'door',
      elements: [
        {
          type: 'rect',
          x: -5,
          y: -40,
          width: 10,
          height: 80,
          fill: '#8B4513',
          stroke: '#654321',
          strokeWidth: 2
        },
        {
          type: 'circle',
          cx: 8,
          cy: 0,
          r: 3,
          fill: '#FFD700',
          stroke: '#DAA520',
          strokeWidth: 1
        },
        {
          type: 'path',
          d: 'M -5 -30 Q 30 -15 -5 0',
          fill: 'none',
          stroke: '#654321',
          strokeWidth: 1,
          strokeDasharray: '3,3'
        }
      ]
    })
  },
  {
    name: 'Window',
    svgData: JSON.stringify({
      type: 'window',
      elements: [
        {
          type: 'rect',
          x: -40,
          y: -5,
          width: 80,
          height: 10,
          fill: '#87CEEB',
          stroke: '#4682B4',
          strokeWidth: 2,
          opacity: 0.6
        },
        {
          type: 'line',
          x1: -40,
          y1: 0,
          x2: 40,
          y2: 0,
          stroke: '#4682B4',
          strokeWidth: 2
        },
        {
          type: 'line',
          x1: 0,
          y1: -5,
          x2: 0,
          y2: 5,
          stroke: '#4682B4',
          strokeWidth: 2
        }
      ]
    })
  }
]

const floorsData = [
  {
    name: 'First Floor - Main Office',
    width: 1000,
    height: 600,
    items: [
      { type: 'Desk', posX: 150, posY: 150, rotation: 0, label: 'Desk 1', assignedTo: '1' },
      { type: 'Desk', posX: 350, posY: 150, rotation: 0, label: 'Desk 2', assignedTo: '2' },
      { type: 'Desk', posX: 550, posY: 150, rotation: 0, label: 'Desk 3', assignedTo: '3' },
      { type: 'Desk', posX: 750, posY: 150, rotation: 0, label: 'Desk 4', assignedTo: '4' },
      { type: 'Chair', posX: 150, posY: 250, rotation: 180, label: 'C1' },
      { type: 'Chair', posX: 350, posY: 250, rotation: 180, label: 'C2' },
      { type: 'Chair', posX: 550, posY: 250, rotation: 180, label: 'C3' },
      { type: 'Chair', posX: 750, posY: 250, rotation: 180, label: 'C4' },
      { type: 'Table', posX: 200, posY: 450, rotation: 0, label: 'Meeting Table' },
      { type: 'Chair', posX: 140, posY: 420, rotation: 90 },
      { type: 'Chair', posX: 260, posY: 420, rotation: 90 },
      { type: 'Chair', posX: 140, posY: 480, rotation: 270 },
      { type: 'Chair', posX: 260, posY: 480, rotation: 270 },
      { type: 'Cabinet', posX: 900, posY: 150, rotation: 0, label: 'Storage' },
      { type: 'Cabinet', posX: 900, posY: 300, rotation: 0, label: 'Files' },
      { type: 'Plant', posX: 50, posY: 50, rotation: 0 },
      { type: 'Plant', posX: 950, posY: 50, rotation: 0 },
      { type: 'Plant', posX: 500, posY: 550, rotation: 0 },
      { type: 'Door', posX: 50, posY: 300, rotation: 0, label: 'Main Entrance' },
      { type: 'Door', posX: 950, posY: 500, rotation: 0, label: 'Exit' },
      { type: 'Window', posX: 200, posY: 30, rotation: 0 },
      { type: 'Window', posX: 500, posY: 30, rotation: 0 },
      { type: 'Window', posX: 800, posY: 30, rotation: 0 }
    ]
  },
  {
    name: 'Second Floor - Conference Area',
    width: 1000,
    height: 600,
    items: [
      { type: 'Table', posX: 500, posY: 300, rotation: 0, label: 'Conference Table' },
      { type: 'Chair', posX: 420, posY: 240, rotation: 180 },
      { type: 'Chair', posX: 500, posY: 240, rotation: 180 },
      { type: 'Chair', posX: 580, posY: 240, rotation: 180 },
      { type: 'Chair', posX: 420, posY: 360, rotation: 0 },
      { type: 'Chair', posX: 500, posY: 360, rotation: 0 },
      { type: 'Chair', posX: 580, posY: 360, rotation: 0 },
      { type: 'Table', posX: 150, posY: 150, rotation: 0, label: 'Break Area' },
      { type: 'Cabinet', posX: 850, posY: 150, rotation: 0, label: 'Supplies' },
      { type: 'Cabinet', posX: 850, posY: 300, rotation: 0, label: 'AV Equipment' },
      { type: 'Plant', posX: 100, posY: 450, rotation: 0 },
      { type: 'Plant', posX: 900, posY: 450, rotation: 0 },
      { type: 'Door', posX: 50, posY: 300, rotation: 0, label: 'Entrance' },
      { type: 'Window', posX: 300, posY: 30, rotation: 0 },
      { type: 'Window', posX: 700, posY: 30, rotation: 0 }
    ]
  },
  {
    name: 'Third Floor - Open Workspace',
    width: 1000,
    height: 600,
    items: [
      { type: 'Desk', posX: 200, posY: 150, rotation: 0, label: 'Desk A1', assignedTo: '5' },
      { type: 'Desk', posX: 400, posY: 150, rotation: 0, label: 'Desk A2', assignedTo: '6' },
      { type: 'Desk', posX: 200, posY: 300, rotation: 180, label: 'Desk B1', assignedTo: '7' },
      { type: 'Desk', posX: 400, posY: 300, rotation: 180, label: 'Desk B2', assignedTo: '8' },
      { type: 'Desk', posX: 700, posY: 200, rotation: 0, label: 'Standing Desk 1' },
      { type: 'Desk', posX: 700, posY: 400, rotation: 0, label: 'Standing Desk 2' },
      { type: 'Table', posX: 300, posY: 500, rotation: 0, label: 'Collab Space' },
      { type: 'Cabinet', posX: 900, posY: 100, rotation: 0, label: 'Resources' },
      { type: 'Plant', posX: 100, posY: 100, rotation: 0 },
      { type: 'Plant', posX: 600, posY: 100, rotation: 0 },
      { type: 'Plant', posX: 900, posY: 500, rotation: 0 },
      { type: 'Door', posX: 500, posY: 570, rotation: 90, label: 'Main Entry' },
      { type: 'Window', posX: 200, posY: 30, rotation: 0 },
      { type: 'Window', posX: 500, posY: 30, rotation: 0 },
      { type: 'Window', posX: 800, posY: 30, rotation: 0 }
    ]
  }
]

async function main() {
  console.log('Starting seed...')

  // Delete existing data
  await prisma.floorItem.deleteMany()
  await prisma.floor.deleteMany()
  await prisma.assetType.deleteMany()
  console.log('Cleared existing data')

  // Create asset types
  const createdAssetTypes: { [key: string]: string } = {}
  for (const assetTypeData of assetTypesData) {
    const assetType = await prisma.assetType.create({
      data: assetTypeData
    })
    createdAssetTypes[assetType.name] = assetType.id
    console.log(`Created asset type: ${assetType.name}`)
  }

  // Create sample assets
  const sampleAssets = [
    { label: 'Executive Desk', assetTypeName: 'Desk', assignedTo: '1' },
    { label: 'Reception Desk', assetTypeName: 'Desk', assignedTo: '2' },
    { label: 'Conference Table', assetTypeName: 'Table', assignedTo: null },
    { label: 'Breakroom Table', assetTypeName: 'Table', assignedTo: null },
    { label: 'Office Chair A1', assetTypeName: 'Chair', assignedTo: '1' },
    { label: 'Office Chair A2', assetTypeName: 'Chair', assignedTo: '2' },
    { label: 'Office Chair A3', assetTypeName: 'Chair', assignedTo: '3' },
    { label: 'Office Chair B1', assetTypeName: 'Chair', assignedTo: '4' },
    { label: 'Office Chair B2', assetTypeName: 'Chair', assignedTo: '5' },
    { label: 'Filing Cabinet 101', assetTypeName: 'Cabinet', assignedTo: null },
    { label: 'Filing Cabinet 102', assetTypeName: 'Cabinet', assignedTo: null },
    { label: 'Storage Cabinet', assetTypeName: 'Cabinet', assignedTo: null },
    { label: 'Lobby Plant', assetTypeName: 'Plant', assignedTo: null },
    { label: 'Office Plant 1', assetTypeName: 'Plant', assignedTo: '6' },
    { label: 'Office Plant 2', assetTypeName: 'Plant', assignedTo: '7' },
  ]

  for (const assetData of sampleAssets) {
    const assetTypeId = createdAssetTypes[assetData.assetTypeName]
    if (assetTypeId) {
      const asset = await prisma.asset.create({
        data: {
          label: assetData.label,
          assetTypeId: assetTypeId,
          assignedTo: assetData.assignedTo
        }
      })
      console.log(`Created asset: ${asset.label} (${assetData.assetTypeName})`)
    }
  }

  // Create floors with items
  for (const floorData of floorsData) {
    const { items, ...floorInfo } = floorData
    const floor = await prisma.floor.create({
      data: {
        ...floorInfo,
        items: {
          create: items
        }
      }
    })
    console.log(`Created floor: ${floor.name} with ${items.length} items`)
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
