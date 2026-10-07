import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SimpleCard } from '../components/Card'
import { Field, Input } from '../components/Form'
import Button from '../components/Button'
import { ErrorBanner } from '../components/Feedback'
import { apiErrorMessage } from '../services/api'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    try {
      await register(email, fullName, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create your account.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 py-16 sm:px-8">
      <SimpleCard title="Create an account" subtitle="Register as an applicant to start a KYC verification.">
        <form onSubmit={onSubmit} className="space-y-4">
          <ErrorBanner message={error} />
          <Field label="Full name">
            <Input required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" hint="At least 8 characters.">
            <Input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" loading={submitting}>
            Create account
          </Button>
        </form>
      </SimpleCard>
      <p className="mt-4 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link to="/login" className="text-brand hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-6 text-center text-xs text-text-faint">
        Reviewer/admin accounts are provisioned separately and cannot self-register here.
      </p>
    </div>
  )
}
