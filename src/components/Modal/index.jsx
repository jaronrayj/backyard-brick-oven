import React, { useEffect } from 'react'

const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const handleClickOutside = (event) => {
      if (!event.target.closest('.modal-content')) {
        onClose()
      }
    }

    if (isOpen) {
      document.body.addEventListener('keydown', handleKeyDown)
      document.body.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.body.removeEventListener('keydown', handleKeyDown)
      document.body.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75">
      <div className="bg-white p-8 rounded-lg relative w-2/3">
        <button className="absolute top-0 right-0 m-4" onClick={onClose}>
          X
        </button>
        {children}
      </div>
    </div>
  )
}

export default Modal
