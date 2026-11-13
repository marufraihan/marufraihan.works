'use client'
import {useState} from 'react'

// Sends through Web3Forms when NEXT_PUBLIC_WEB3FORMS_KEY is set; otherwise opens the visitor's email app.
const KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY
const TYPES = ['Architecture', 'Photography', 'Experiential / projection mapping', 'Film & post-production', 'Something else']

export default function ContactForm({email}) {
  const [state, setState] = useState('idle')
  async function submit(e) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('botcheck')) return
    if (!KEY) {
      const body = `${f.get('message')}\n\n${f.get('name')}\n${f.get('email')}`
      window.location.href = `mailto:${email}?subject=${encodeURIComponent('Project enquiry: ' + f.get('type'))}&body=${encodeURIComponent(body)}`
      return
    }
    setState('sending')
    f.append('access_key', KEY)
    f.append('subject', `Website enquiry: ${f.get('type')}`)
    try {
      const r = await fetch('https://api.web3forms.com/submit', {method: 'POST', body: f})
      const j = await r.json()
      setState(j.success ? 'sent' : 'error')
      if (j.success) e.target.reset()
    } catch {
      setState('error')
    }
  }
  if (state === 'sent') return <p className="formmsg">Thank you. Your message has been sent, and we will reply by email.</p>
  return (
    <form className="contact" onSubmit={submit}>
      <label>
        Name
        <input name="name" type="text" autoComplete="name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label className="w">
        Project type
        <select name="type">
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="w">
        Tell us about the project
        <textarea name="message" rows={4} required />
      </label>
      <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" style={{display: 'none'}} aria-hidden="true" />
      <div className="w">
        <button className="btn" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Send message →'}
        </button>
        {state === 'error' && <p className="formmsg">Sorry, that did not go through. Please email {email} directly.</p>}
      </div>
    </form>
  )
}
