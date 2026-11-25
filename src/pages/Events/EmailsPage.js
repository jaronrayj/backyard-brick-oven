import React from 'react'
import { useNavigate } from 'react-router-dom'
import AdminOnly from './AdminOnly'
import Emails from './Emails'

// /admin/emails, on the team home: the same email wording as Events > Emails.
const Live = () => {
  const navigate = useNavigate()
  return <Emails onClose={() => navigate('/team')} />
}

const EmailsPage = () => (
  <AdminOnly title="Email templates">
    <Live />
  </AdminOnly>
)

export default EmailsPage
