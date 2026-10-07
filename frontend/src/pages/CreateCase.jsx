import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import PageHeader from '../components/PageHeader'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/Card'
import Button from '../components/Button'
import { LoadingSpinner, ErrorBanner } from '../components/Feedback'
import StatusBadge from '../components/StatusBadge'
import { Field, Select, Checkbox } from '../components/Form'

const STEPS = ['Create Case', 'Document', 'Video KYC', 'Results']
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
const ALLOWED_VIDEO_TYPES = ['video/webm', 'video/mp4', 'video/quicktime', 'video/x-matroska']
const CHALLENGES = [
  { value: 'BLINK_TWICE', label: 'Blink twice' },
  { value: 'TURN_LEFT', label: 'Turn head left' },
  { value: 'TURN_RIGHT', label: 'Turn head right' },
]
const PROCESSING_STAGES = [
  'Uploading video',
  'Extracting frames',
  'Liveness analysis',
  'rPPG analysis',
  'Replay analysis',
  'Deepfake analysis',
  'Risk assessment',
]

// Maps an Axios error to a short, understandable message. Never
// exposes raw Axios/stack-trace text to the user; falls back to the
// backend's own `detail` string when present (those are already
// written to be human-readable) or a generic per-context fallback.
function friendlyError(err, fallback) {
  if (!err?.response) {
    return 'Network error -- please check your connection and try again.'
  }
  const status = err.response.status
  const detail = err.response.data?.detail
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return "You don't have permission to perform this action."
  if (status === 404) return 'This case or document could not be found.'
  if (status === 422) return typeof detail === 'string' ? detail : 'The submitted data was invalid. Please check and try again.'
  if (status === 500) return 'The server encountered an error processing this. Please try again.'
  if (status === 502 || status === 503) return 'The server is temporarily unavailable. Please try again shortly.'
  return typeof detail === 'string' ? detail : fallback
}

function formatBytes(bytes) {
  if (!bytes) return '0 KB'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

function StepIndicator({ currentStep }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
      {STEPS.map((label, i) => {
        const stepNum = i + 1
        const done = stepNum < currentStep
        const active = stepNum === currentStep
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs mono ${
                done
                  ? 'border-verified bg-verified/15 text-verified'
                  : active
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-border text-text-faint'
              }`}
            >
              {done ? '✓' : stepNum}
            </span>
            <span className={active ? 'font-medium text-text' : done ? 'text-text-muted' : 'text-text-faint'}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-border-soft" />}
          </li>
        )
      })}
    </ol>
  )
}

export default function CreateCase() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  // Step 1
  const [caseId, setCaseId] = useState(null)
  const [creatingCase, setCreatingCase] = useState(false)
  const [createError, setCreateError] = useState('')

  // Step 2
  const [docFile, setDocFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docError, setDocError] = useState('')
  const [docResult, setDocResult] = useState(null)

  // Step 3
  const [videoMode, setVideoMode] = useState('upload') // 'upload' | 'camera'
  const [videoFile, setVideoFile] = useState(null) // File (upload mode)
  const [recordedBlob, setRecordedBlob] = useState(null) // Blob (camera mode)
  const [recordedUrl, setRecordedUrl] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [challengeType, setChallengeType] = useState('BLINK_TWICE')
  const [consent, setConsent] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processingStageIdx, setProcessingStageIdx] = useState(0)
  const [videoError, setVideoError] = useState('')
  const [videoResult, setVideoResult] = useState(null)

  const videoPreviewRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])

  useEffect(() => {
    // Stop any open camera stream if the user navigates away mid-capture.
    return () => {
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ------------------------------------------------------------ Step 1 --

  async function handleCreateCase() {
    setCreateError('')
    setCreatingCase(true)
    try {
      const res = await api.post('/kyc/create')
      setCaseId(res.data.id)
      setStep(2)
    } catch (err) {
      setCreateError(friendlyError(err, 'Could not create a new KYC case. Please try again.'))
    } finally {
      setCreatingCase(false)
    }
  }

  // ------------------------------------------------------------ Step 2 --

  function pickDocFile(file) {
    if (!file) return
    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      setDocError('Unsupported file type. Please use JPG, JPEG, PNG, or PDF.')
      return
    }
    setDocError('')
    setDocResult(null)
    setDocFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    pickDocFile(e.dataTransfer.files?.[0])
  }

  async function handleUploadDocument() {
    if (!docFile || !caseId) return
    setUploadingDoc(true)
    setDocError('')
    try {
      const form = new FormData()
      form.append('case_id', caseId)
      form.append('file', docFile)
      const uploadRes = await api.post('/kyc/document/upload', form)
      const documentId = uploadRes.data.document_id

      const analyzeForm = new FormData()
      analyzeForm.append('case_id', caseId)
      analyzeForm.append('document_id', documentId)
      const analyzeRes = await api.post('/kyc/document/analyze', analyzeForm)
      setDocResult(analyzeRes.data)
    } catch (err) {
      setDocError(friendlyError(err, 'Unable to process this document. Please try again.'))
    } finally {
      setUploadingDoc(false)
    }
  }

  // Document status is derived honestly from what the backend actually
  // returned -- never assumed VERIFIED just because the call succeeded.
  function documentStatus(result) {
    if (!result) return null
    if (result.tampering_flag === true) return 'FLAGGED'
    if (result.authenticity_score == null) return 'UNAVAILABLE'
    if (result.tampering_flag === false) return 'VERIFIED'
    return 'PENDING'
  }

  // ------------------------------------------------------------ Step 3 --

  function pickVideoFile(file) {
    if (!file) return
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setVideoError('Unsupported video format. Please use MP4, WebM, MOV, or MKV.')
      return
    }
    setVideoError('')
    setVideoResult(null)
    setVideoFile(file)
  }

  async function startRecording() {
    setVideoError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      mediaStreamRef.current = stream
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        videoPreviewRef.current.play()
      }
      recordedChunksRef.current = []
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        setRecordedBlob(blob)
        setRecordedUrl(URL.createObjectURL(blob))
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      setVideoError('Could not access the camera. Check browser permissions and try again, or upload a video instead.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  function retakeRecording() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedBlob(null)
    setRecordedUrl(null)
    setVideoResult(null)
  }

  async function handleSubmitVideo() {
    const file = videoMode === 'upload' ? videoFile : recordedBlob
    if (!file || !caseId) return
    if (!consent) {
      setVideoError('Please confirm consent to temporary video processing before continuing.')
      return
    }
    setProcessing(true)
    setVideoError('')
    setProcessingStageIdx(0)

    // Purely a "work is happening" indicator -- cycles through the real
    // pipeline stages while the single backend call is in flight. It
    // never asserts a stage passed/failed; actual results only appear
    // once the real response comes back below.
    const ticker = setInterval(() => {
      setProcessingStageIdx((i) => Math.min(i + 1, PROCESSING_STAGES.length - 1))
    }, 900)

    try {
      const form = new FormData()
      form.append('case_id', caseId)
      form.append('challenge_type', challengeType)
      form.append('consent', 'true')
      const filename = videoMode === 'upload' ? file.name : 'capture.webm'
      form.append('file', file, filename)

      const res = await api.post('/kyc/video/process', form)
      setVideoResult(res.data)
    } catch (err) {
      setVideoError(friendlyError(err, 'Unable to process this video. Please try again.'))
    } finally {
      clearInterval(ticker)
      setProcessing(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Start New KYC Verification"
        description="Document forensics, biometric matching, liveness (including rPPG), replay and deepfake detection, combined into one explainable fraud-risk decision."
      />
      <StepIndicator currentStep={step} />

      {step === 1 && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle subtitle="Creates a new case tied to your account. You'll upload a document and complete a short video check next.">
              Step 1 -- Create Case
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBanner message={createError} />
            <Button className="mt-2" onClick={handleCreateCase} loading={creatingCase}>
              Create KYC Case
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle subtitle={<span className="mono">Case ID: {caseId}</span>}>Step 2 -- Document Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBanner message={docError} />

            {!docResult && (
              <>
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragActive(true)
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('doc-file-input').click()}
                  className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                    dragActive ? 'border-brand bg-brand-soft' : 'border-border hover:border-brand/50'
                  }`}
                >
                  <p className="text-sm text-text">Drag &amp; drop your ID document here, or click to browse</p>
                  <p className="mt-1 text-xs text-text-faint">JPG, JPEG, PNG, or PDF</p>
                  <input
                    id="doc-file-input"
                    type="file"
                    accept={ALLOWED_DOC_TYPES.join(',')}
                    className="hidden"
                    onChange={(e) => pickDocFile(e.target.files?.[0])}
                  />
                </div>

                {docFile && (
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                    <div>
                      <div className="text-text">{docFile.name}</div>
                      <div className="text-xs text-text-faint">{formatBytes(docFile.size)}</div>
                    </div>
                    <button onClick={() => setDocFile(null)} className="text-xs text-text-muted hover:text-flagged">
                      Remove
                    </button>
                  </div>
                )}

                <Button className="mt-4" onClick={handleUploadDocument} disabled={!docFile} loading={uploadingDoc}>
                  Upload Document
                </Button>
                {uploadingDoc && <div className="mt-3"><LoadingSpinner label="Uploading and analyzing document..." /></div>}
              </>
            )}

            {docResult && (
              <div className="mt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">Document result</span>
                  <StatusBadge status={documentStatus(docResult)} />
                </div>
                <dl className="space-y-1.5 text-xs">
                  <Row label="Extracted name" value={docResult.extracted_name} />
                  <Row label="Extracted DOB" value={docResult.extracted_dob} />
                  <Row
                    label="Authenticity score"
                    value={docResult.authenticity_score != null ? `${Math.round(docResult.authenticity_score)}%` : null}
                  />
                  <Row
                    label="Tampering probability"
                    value={docResult.tampering_probability != null ? `${Math.round(docResult.tampering_probability * 100)}%` : null}
                  />
                </dl>
                {docResult.authenticity_score == null && (
                  <p className="text-xs text-text-faint">
                    OCR text extraction is unavailable in this environment; tampering analysis (shown above) does not
                    require it and is real.
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            {docResult && <Button onClick={() => setStep(3)}>Continue to Video KYC</Button>}
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle subtitle={<span className="mono">Case ID: {caseId}</span>}>Step 3 -- Video KYC</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBanner message={videoError} />

            <p className="mb-4 text-xs text-text-muted">
              Your video is used only to compute the checks below and is deleted immediately afterward -- it is never
              stored permanently.
            </p>

            {!videoResult && !processing && (
              <>
                <div className="mb-4 flex gap-2 text-xs">
                  <button
                    onClick={() => setVideoMode('upload')}
                    className={`rounded-lg border px-3 py-1.5 ${videoMode === 'upload' ? 'border-brand bg-brand-soft text-brand' : 'border-border text-text-muted'}`}
                  >
                    Upload Video
                  </button>
                  <button
                    onClick={() => setVideoMode('camera')}
                    className={`rounded-lg border px-3 py-1.5 ${videoMode === 'camera' ? 'border-brand bg-brand-soft text-brand' : 'border-border text-text-muted'}`}
                  >
                    Camera Capture
                  </button>
                </div>

                {videoMode === 'upload' && (
                  <>
                    <div
                      onClick={() => document.getElementById('video-file-input').click()}
                      className="cursor-pointer rounded-xl border-2 border-dashed border-border px-6 py-8 text-center hover:border-brand/50"
                    >
                      <p className="text-sm text-text">Click to select a video file</p>
                      <p className="mt-1 text-xs text-text-faint">MP4, WebM, MOV, or MKV</p>
                      <input
                        id="video-file-input"
                        type="file"
                        accept={ALLOWED_VIDEO_TYPES.join(',')}
                        className="hidden"
                        onChange={(e) => pickVideoFile(e.target.files?.[0])}
                      />
                    </div>
                    {videoFile && (
                      <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                        <div>
                          <div className="text-text">{videoFile.name}</div>
                          <div className="text-xs text-text-faint">{formatBytes(videoFile.size)}</div>
                        </div>
                        <button onClick={() => setVideoFile(null)} className="text-xs text-text-muted hover:text-flagged">
                          Remove
                        </button>
                      </div>
                    )}
                  </>
                )}

                {videoMode === 'camera' && (
                  <div>
                    <video
                      ref={videoPreviewRef}
                      muted
                      playsInline
                      className="w-full rounded-lg border border-border bg-ink"
                      style={{ display: recordedUrl ? 'none' : 'block', maxHeight: 280 }}
                    />
                    {recordedUrl && (
                      <video src={recordedUrl} controls playsInline className="w-full rounded-lg border border-border" style={{ maxHeight: 280 }} />
                    )}
                    <div className="mt-3 flex gap-2">
                      {!isRecording && !recordedUrl && <Button size="sm" onClick={startRecording}>Start Recording</Button>}
                      {isRecording && <Button size="sm" variant="danger" onClick={stopRecording}>Stop Recording</Button>}
                      {recordedUrl && !isRecording && (
                        <Button size="sm" variant="outline" onClick={retakeRecording}>Retake</Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-5 space-y-4">
                  <Field label="Liveness challenge">
                    <Select value={challengeType} onChange={(e) => setChallengeType(e.target.value)}>
                      {CHALLENGES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Checkbox
                    label="I consent to the temporary processing of my video for identity verification. It is not stored permanently."
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                </div>

                <Button
                  className="mt-4"
                  onClick={handleSubmitVideo}
                  disabled={!consent || (videoMode === 'upload' ? !videoFile : !recordedBlob)}
                >
                  Submit for Verification
                </Button>
              </>
            )}

            {processing && (
              <div className="py-6">
                <LoadingSpinner label={PROCESSING_STAGES[processingStageIdx]} />
                <ol className="mt-4 space-y-1.5 text-xs">
                  {PROCESSING_STAGES.map((s, i) => (
                    <li key={s} className={i <= processingStageIdx ? 'text-text' : 'text-text-faint'}>
                      {i < processingStageIdx ? '✓ ' : i === processingStageIdx ? '… ' : '○ '}
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {videoResult && (
              <div className="space-y-3">
                <ResultRow label="Liveness" status={videoResult.liveness?.passed === true ? 'VERIFIED' : videoResult.liveness?.passed === false ? 'FLAGGED' : 'UNAVAILABLE'} />
                <ResultRow label="rPPG" status={videoResult.rppg?.status} />
                <ResultRow label="Replay Detection" status={videoResult.replay?.status} />
                <ResultRow label="Deepfake Detection" status={videoResult.deepfake?.status} />
                <ResultRow label="Face Match" status={videoResult.face?.match_status} />
                {videoResult.risk && (
                  <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <span className="text-sm font-medium text-text">Fraud Risk</span>
                    <div className="flex items-center gap-2">
                      <span className="mono text-sm text-text-muted">{Math.round(videoResult.risk.fraud_risk_score)}/100</span>
                      <StatusBadge status={videoResult.risk.decision} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)} disabled={processing}>
              Back
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard')} disabled={processing}>
              Cancel
            </Button>
            {videoResult && <Button onClick={() => navigate(`/cases/${caseId}`)}>View Full Results</Button>}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-text-faint">{label}</dt>
      <dd className="text-text">{value ?? '—'}</dd>
    </div>
  )
}

function ResultRow({ label, status }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border-soft px-4 py-2.5 text-sm">
      <span className="text-text-muted">{label}</span>
      <StatusBadge status={status} />
    </div>
  )
}
