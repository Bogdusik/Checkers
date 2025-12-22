'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, Trophy, TrendingDown, Calendar, Mail, Shield, ArrowLeft } from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user || !data.user.isAdmin) {
          router.push('/')
          return
        }
        setUser(data.user)
        fetchUsers()
      })
      .catch(() => router.push('/'))
  }, [router])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Никогда'
    return new Date(date).toLocaleString('ru-RU')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 glass-dark text-white rounded-lg hover:bg-opacity-50 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Назад
              </Link>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-400" />
                <h1 className="text-4xl font-bold text-white">Админ панель</h1>
              </div>
            </div>
          </div>
          <p className="text-gray-400 ml-20">Управление игроками и статистикой</p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-400" />
              <span className="text-gray-400">Всего игроков</span>
            </div>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-dark rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span className="text-gray-400">Всего игр</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {users.reduce((sum: number, u: any) => sum + (u.statistics?.totalGames || 0), 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-dark rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-6 h-6 text-green-400" />
              <span className="text-gray-400">Активных</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {users.filter((u: any) => u.lastLoginAt && new Date(u.lastLoginAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-dark rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-purple-400" />
              <span className="text-gray-400">Сегодня</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {users.filter((u: any) => {
                if (!u.lastLoginAt) return false
                const today = new Date()
                const loginDate = new Date(u.lastLoginAt)
                return loginDate.toDateString() === today.toDateString()
              }).length}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-2xl p-6 overflow-x-auto"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Список игроков</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Игрок</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Email</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Игр</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Побед</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Поражений</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Ничьих</th>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Последний вход</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-800 hover:bg-black/20 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{u.username}</span>
                      {u.isAdmin && (
                        <Shield className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail className="w-4 h-4" />
                      <span>{u.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-white">
                    {u.statistics?.totalGames || 0}
                  </td>
                  <td className="py-4 px-4 text-center text-green-400 font-semibold">
                    {u.statistics?.wins || 0}
                  </td>
                  <td className="py-4 px-4 text-center text-red-400 font-semibold">
                    {u.statistics?.losses || 0}
                  </td>
                  <td className="py-4 px-4 text-center text-yellow-400 font-semibold">
                    {u.statistics?.draws || 0}
                  </td>
                  <td className="py-4 px-4 text-gray-400 text-sm">
                    {formatDate(u.lastLoginAt)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  )
}

