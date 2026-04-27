import { useEffect, useState } from 'react'
import { Search, UserCheck, Ban, Camera, Trash2, ChevronDown, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Card, Badge } from '@/components/ui/index'
import { usersApi } from '@/api'
import type { User } from '@/types'
import { getStatusLabel, getStatusColor, formatDate } from '@/lib/utils'

export default function Users() {
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('')
  const [openId,  setOpenId]  = useState<number | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [saving,   setSaving]   = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (status) params.status = status
    const res = await usersApi.list(params)
    setUsers((res.data as any).results ?? res.data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [search, status])

  const approve = async (id: number) => {
    await usersApi.approve(id)
    fetchUsers()
  }

  const ban = async (id: number) => {
    if (!confirm('Bloklashni tasdiqlaysizmi?')) return
    await usersApi.ban(id)
    fetchUsers()
  }

  const del = async (id: number) => {
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return
    await usersApi.delete(id)
    fetchUsers()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setSaving(true)
    try {
      await usersApi.update(editUser.id, editUser)
      setEditUser(null)
      fetchUsers()
    } catch (err) {
      alert('Xatolik yuz berdi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Xodimlar</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} ta xodim</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="h-11 px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Barchasi</option>
          <option value="active">Faol</option>
          <option value="pending">Kutilmoqda</option>
          <option value="banned">Bloklangan</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Xodimlar topilmadi
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {['Xodim', 'Telefon', 'Lavozim', 'Holat', 'FaceID', 'Amallar'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {user.firstname[0]}{user.lastname[0]}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.phone}</td>
                    <td className="px-4 py-3">{user.position}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                        {getStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.has_face
                        ? <Badge variant="success">✓ Bor</Badge>
                        : <Badge variant="warning">Yo'q</Badge>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {user.status === 'pending' && (
                          <Button size="sm" variant="success" onClick={() => approve(user.id)} title="Tasdiqlash">
                            <UserCheck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {user.status === 'active' && (
                          <Button size="sm" variant="warning" onClick={() => ban(user.id)} title="Bloklash">
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm" variant="outline"
                          onClick={() => setEditUser(user)}
                          title="Tahrirlash"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => window.location.href = `/admin/users/${user.id}/face`}
                          title="FaceID"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </Button>
                        {user.role !== 'admin' && (
                          <Button size="sm" variant="outline" onClick={() => del(user.id)} title="O'chirish"
                            className="text-destructive hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Xodimni tahrirlash</h2>
              <button onClick={() => setEditUser(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Ism</label>
                  <Input 
                    value={editUser.firstname} 
                    onChange={e => setEditUser({...editUser, firstname: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Familiya</label>
                  <Input 
                    value={editUser.lastname} 
                    onChange={e => setEditUser({...editUser, lastname: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Lavozim</label>
                <Input 
                  value={editUser.position} 
                  onChange={e => setEditUser({...editUser, position: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Telefon</label>
                <Input 
                  value={editUser.phone} 
                  onChange={e => setEditUser({...editUser, phone: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Holat</label>
                <select
                  value={editUser.status}
                  onChange={e => setEditUser({...editUser, status: e.target.value as any})}
                  className="h-11 w-full px-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">Faol</option>
                  <option value="pending">Kutilmoqda</option>
                  <option value="banned">Bloklangan</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditUser(null)}>
                  Bekor qilish
                </Button>
                <Button type="submit" className="flex-1" loading={saving}>
                  Saqlash
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
