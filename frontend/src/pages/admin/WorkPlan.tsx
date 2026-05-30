import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '@/components/ui/index'
import { usersApi } from '@/api'
import { Plus, ListTodo, Users, CheckCircle, CalendarDays } from 'lucide-react'
import type { Task, User } from '@/types'
import { formatTime } from '@/lib/utils'

export function WorkPlanPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  
  // Create Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [targetUsers, setTargetUsers] = useState<number[] | 'all'>('all')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchTasks = async () => {
    try {
      const res = await usersApi.getTasks()
      // API typically returns data directly or paginated in results
      const data = (res.data as any).results ?? res.data
      setTasks(data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await usersApi.list({ role: 'user', status: 'active' })
      setUsers(res.data.results ?? (res.data as any))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    Promise.all([fetchTasks(), fetchUsers()]).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return alert("Vazifa nomi majburiy")
    
    setIsSubmitting(true)
    try {
      await usersApi.createTask({
        title,
        description,
        due_date: dueDate ? dueDate + 'T00:00:00' : undefined,
        users: targetUsers
      })
      alert("Vazifalar muvaffaqiyatli biriktirildi va bildirishnomalar yuborildi!")
      setTitle('')
      setDescription('')
      setDueDate('')
      setTargetUsers('all')
      fetchTasks()
    } catch (err) {
      alert("Xatolik yuz berdi")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === 'all') {
      setTargetUsers('all')
    } else {
      const opts = Array.from(e.target.selectedOptions, option => parseInt(option.value))
      setTargetUsers(opts)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-primary" /> Ish rejalari
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Xodimlarga vazifalar taqsimlash va nazorat qilish</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Create Task Form */}
        <Card className="lg:col-span-1 h-fit shadow-lg shadow-primary/5 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Yangi vazifa yaratish
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground/80">Vazifa nomi *</label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Masalan: Oylik hisobotni tayyorlash" 
                  required 
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground/80">Tavsif (ixtiyoriy)</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Vazifa bo'yicha batafsil ma'lumot..."
                  className="w-full h-24 px-3 py-2 text-sm rounded-xl border border-input bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-shadow"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-2 text-foreground/80">
                  <CalendarDays className="w-4 h-4" /> Oxirgi muddat (ixtiyoriy)
                </label>
                <Input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-2 text-foreground/80">
                  <Users className="w-4 h-4" /> Kichkimga biriktiriladi?
                </label>
                <select
                  multiple
                  value={targetUsers === 'all' ? ['all'] : targetUsers.map(String)}
                  onChange={handleUserSelect}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px]"
                >
                  <option value="all" className="font-bold text-primary py-1">Hammaga (Aktiv xodimlar)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id.toString()} className="py-1">
                      {u.firstname} {u.lastname} ({u.position})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">Ko'p tanlash uchun Ctrl ni bosib turing.</p>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                {isSubmitting ? 'Biriktirilmoqda...' : 'Vazifani tarqatish'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Task List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Barcha vazifalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Hozircha vazifalar mavjud emas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => {
                  const user = users.find(u => u.id === task.user)
                  return (
                    <div 
                      key={task.id} 
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${task.is_completed ? 'bg-muted/30 border-muted' : 'bg-background hover:border-primary/30 border-primary/10'}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className={`font-bold ${task.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.title}
                          </h4>
                          <Badge variant={task.is_completed ? 'info' : 'default'} className="text-[10px] px-1.5 py-0">
                            {task.is_completed ? 'Bajarilgan' : 'Jarayonda'}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className={`text-xs mt-1 ${task.is_completed ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            To: <strong className="text-foreground/80">{user ? `${user.firstname} ${user.lastname}` : `User #${task.user}`}</strong>
                          </span>
                          {task.deadline && (
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <CalendarDays className="w-3 h-3" /> 
                              {formatTime(task.deadline).slice(0, 10)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
