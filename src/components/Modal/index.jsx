import React from 'react'

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75">
      <div className="bg-white p-8 rounded-lg">
        {children}
        <button className="absolute top-0 right-0 m-4" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

export default Modal
