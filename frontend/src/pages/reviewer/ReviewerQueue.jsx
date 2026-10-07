import PageHeader from '../../components/PageHeader'
import { EmptyState } from '../../components/Feedback'

export default function ReviewerQueue() {
  return (
    <div>
      <PageHeader title="ReviewerQueue" description="This page is being built in the next stage." />
      <EmptyState title="Coming up next" description="Wired to the FastAPI backend in the following build stage." />
    </div>
  )
}
