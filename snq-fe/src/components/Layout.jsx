import { motion } from 'framer-motion'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <motion.main 
        className="flex-1 overflow-auto"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.main>
    </div>
  )
}

export default Layout 