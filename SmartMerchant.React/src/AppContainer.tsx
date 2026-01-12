import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { useAppStore } from '@/store'

function AppContainer() {
  const initializeStore = useAppStore((state) => state.initializeStore)

  useEffect(() => {
    initializeStore()
  }, [initializeStore])

  return <RouterProvider router={router} />
}

export default AppContainer
