import { useAppStore } from '@/store'
import type { User } from '@/types'

export function AdminUsersPage() {
  const { users } = useAppStore()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black oswald uppercase">
          User <span className="lime-text">Management</span>
        </h2>
        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">
          View registered users
        </p>
      </div>

      <div className="glass-card p-8">
        <h3 className="text-xl font-black oswald uppercase mb-6">All Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/10">
              <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <th className="pb-4 pr-4">Username</th>
                <th className="pb-4 pr-4">First Name</th>
                <th className="pb-4 pr-4">Last Name</th>
                <th className="pb-4">Middle Name</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 font-bold">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user: User) => (
                  <tr key={user.guid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 pr-4 lime-text">{user.username}</td>
                    <td className="py-4 pr-4">{user.firstName}</td>
                    <td className="py-4 pr-4">{user.lastName}</td>
                    <td className="py-4 text-gray-500">{user.middleName || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
