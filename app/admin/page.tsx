'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, Trophy, TrendingDown, Calendar, Mail, Shield, ArrowLeft } from 'lucide-react'
import { formatDate, isActiveUser, isToday } from '@/lib/utils'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 sm:p-4 flex flex-col">
      <div className="container mx-auto max-w-7xl w-full">
        {/* Header - stays at top */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 glass-dark text-white rounded-lg hover:bg-opacity-50 transition-all text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Назад</span>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Админ панель</h1>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm sm:text-base ml-0 sm:ml-20">Управление игроками и статистикой</p>
        </motion.div>
      </div>

      {/* Main content - centered vertically */}
      <div className="flex-1 flex items-center justify-center">
        <div className="container mx-auto max-w-7xl w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark rounded-2xl p-3 sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Всего игроков</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{users.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-dark rounded-2xl p-3 sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Всего игр</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
              {users.reduce((sum: number, u: any) => sum + (u.statistics?.totalGames || 0), 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-dark rounded-2xl p-3 sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <TrendingDown className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Активных</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
              {users.filter((u: any) => isActiveUser(u.lastLoginAt, 7)).length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-dark rounded-2xl p-3 sm:p-6"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
              <span className="text-gray-400 text-xs sm:text-sm">Сегодня</span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
              {users.filter((u: any) => isToday(u.lastLoginAt)).length}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-2xl p-3 sm:p-6 overflow-x-auto"
        >
          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Список игроков</h2>
          {/* Mobile card view */}
          <div className="block md:hidden space-y-3">
            {users.map((u, index) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-black/20 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{u.username}</span>
                    {u.isAdmin && (
                      <Shield className="w-3 h-3 text-blue-400" />
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{u.email}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-gray-400">Игр</div>
                    <div className="text-white font-semibold">{u.statistics?.totalGames || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Побед</div>
                    <div className="text-green-400 font-semibold">{u.statistics?.wins || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Пораж.</div>
                    <div className="text-red-400 font-semibold">{u.statistics?.losses || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Ничьих</div>
                    <div className="text-yellow-400 font-semibold">{u.statistics?.draws || 0}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
                  {formatDate(u.lastLoginAt)}
                </div>
              </motion.div>
            ))}
          </div>
          {/* Desktop table view */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Игрок</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Email</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Игр</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Побед</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Поражений</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-semibold text-sm">Ничьих</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold text-sm">Последний вход</th>
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
                        <span className="text-white font-medium text-sm">{u.username}</span>
                        {u.isAdmin && (
                          <Shield className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Mail className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center text-white text-sm">
                      {u.statistics?.totalGames || 0}
                    </td>
                    <td className="py-4 px-4 text-center text-green-400 font-semibold text-sm">
                      {u.statistics?.wins || 0}
                    </td>
                    <td className="py-4 px-4 text-center text-red-400 font-semibold text-sm">
                      {u.statistics?.losses || 0}
                    </td>
                    <td className="py-4 px-4 text-center text-yellow-400 font-semibold text-sm">
                      {u.statistics?.draws || 0}
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">
                      {formatDate(u.lastLoginAt)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  )
}

