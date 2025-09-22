import React from 'react'

interface ToastProps {
  message: string;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div className="fixed top-6 right-6 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50 animate-fadeIn">
      ✅ {message}
    </div>
  )
}

export default Toast;
