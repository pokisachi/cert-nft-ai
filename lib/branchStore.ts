import { promises as fs } from 'fs'
import path from 'path'

export type Branch = {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
}

const storePath = path.join(process.cwd(), 'tmp', 'branches.json')

const defaults: Branch[] = [
  {
    id: 'HN-01',
    name: 'Chi nhánh Hà Nội – Cầu Giấy',
    address: 'Số 1 Trần Thái Tông, Cầu Giấy, Hà Nội',
    latitude: 21.028511,
    longitude: 105.804817,
  },
  {
    id: 'HCM-01',
    name: 'Chi nhánh TP.HCM – Quận 1',
    address: '12 Nguyễn Huệ, Quận 1, TP.HCM',
    latitude: 10.773374,
    longitude: 106.704886,
  },
  {
    id: 'DN-01',
    name: 'Chi nhánh Đà Nẵng – Hải Châu',
    address: '24 Bạch Đằng, Hải Châu, Đà Nẵng',
    latitude: 16.06778,
    longitude: 108.22083,
  },
  {
    id: 'CT-01',
    name: 'Chi nhánh Cần Thơ – Ninh Kiều',
    address: '3 Hòa Bình, Ninh Kiều, Cần Thơ',
    latitude: 10.034267,
    longitude: 105.788139,
  },
]

async function ensureFile() {
  try {
    await fs.access(storePath)
  } catch {
    const dir = path.dirname(storePath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(storePath, JSON.stringify(defaults, null, 2), 'utf-8')
  }
}

export async function listBranches(): Promise<Branch[]> {
  await ensureFile()
  const data = await fs.readFile(storePath, 'utf-8')
  return JSON.parse(data)
}

export async function saveBranches(items: Branch[]) {
  await ensureFile()
  await fs.writeFile(storePath, JSON.stringify(items, null, 2), 'utf-8')
}

export async function addBranch(item: Omit<Branch, 'id'> & { id?: string }) {
  const items = await listBranches()
  if (!item.id) {
    item.id = `BR-${Date.now().toString().slice(-6)}`
  }
  const exists = items.some((b) => b.id === item.id)
  if (exists) throw new Error('DUPLICATE_ID')
  items.push(item as Branch)
  await saveBranches(items)
  return item
}

export async function updateBranch(id: string, patch: Partial<Branch>) {
  const items = await listBranches()
  const idx = items.findIndex((b) => b.id === id)
  if (idx === -1) throw new Error('NOT_FOUND')
  items[idx] = { ...items[idx], ...patch, id: items[idx].id }
  await saveBranches(items)
  return items[idx]
}

export async function deleteBranch(id: string) {
  const items = await listBranches()
  const next = items.filter((b) => b.id !== id)
  await saveBranches(next)
  return { deleted: id }
}

