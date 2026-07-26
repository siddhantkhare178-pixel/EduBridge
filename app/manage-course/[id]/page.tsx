import { ManageCourseClient } from "./ManageCourseClient"

export default function ManageCoursePage({ params }: { params: Promise<{ id: string }> }) {
  return <ManageCourseClient params={params} />
}