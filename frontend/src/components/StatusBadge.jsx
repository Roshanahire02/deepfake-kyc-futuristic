// Generic status pill used everywhere a backend status string is shown
// (case status, document/liveness/deepfake/replay/reviewer-action
// status). Purely a presentation mapping -- never invents a status,
// only colors/labels the one the API returned.
const TONE_STYLES = {
  verified: 'bg-verified/10 text-verified border-verified/30',
  pending: 'bg-pending/10 text-pending border-pending/30',
  review: 'bg-review/10 text-review border-review/30',
  flagged: 'bg-flagged/10 text-flagged border-flagged/30',
  neutral: 'bg-white/5 text-text-muted border-border',
}

// Ordered map of substrings -> tone. First match wins.
const RULES = [
  [['VERIFIED', 'APPROVED', 'PASSED', 'MATCHED', 'LOW', 'NOT DETECTED', 'NOT_DETECTED', 'LOW SUSPICION', 'DONE', 'COMPLETE', 'ONLINE', 'AVAILABLE'], 'verified'],
  [['FLAGGED', 'REJECTED', 'NOT_MATCHED', 'HIGH', 'FAILED', 'FAIL', 'DETECTED', 'ERROR', 'CRITICAL'], 'flagged'],
  [['MANUAL_REVIEW', 'MEDIUM', 'PROCESSING', 'PENDING_REVIEW', 'ANALYZING', 'DEGRADED'], 'review'],
  [['UNAVAILABLE', 'TRAINING REQUIRED', 'TRAINING_REQUIRED', 'DEPENDENCY', 'NOT_EVALUATED', 'NOT EVALUATED', 'PENDING', 'INSUFFICIENT'], 'pending'],
]

function toneFor(status) {
  if (!status) return 'neutral'
  const s = String(status).toUpperCase()
  for (const [keywords, tone] of RULES) {
    if (keywords.some((k) => s.includes(k))) return tone
  }
  return 'neutral'
}

const DOT_COLOR = {
  verified: 'text-verified',
  flagged: 'text-flagged',
  review: 'text-review',
  pending: 'text-pending',
  neutral: 'text-text-faint',
}

// 'live' statuses pulse to read as actively-monitored, not just inert text.
const LIVE_TONES = new Set(['review'])

export default function StatusBadge({ status, label, showIcon = true }) {
  const tone = toneFor(status)
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium mono tracking-wide ${TONE_STYLES[tone]}`}
    >
      {showIcon && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full bg-current ${DOT_COLOR[tone]} ${LIVE_TONES.has(tone) ? 'pulse-dot' : ''}`}
        />
      )}
      {(label || status || 'UNKNOWN').toString().replace(/_/g, ' ')}
    </span>
  )
}
