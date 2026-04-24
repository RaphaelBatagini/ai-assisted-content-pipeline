import PostEditorForm from "@/components/PostEditorForm";

interface EditPostPageProps {
  params: { siteId: string; postId: string };
}

export default function EditPostPage({ params }: EditPostPageProps) {
  return <PostEditorForm postId={params.postId} />;
}
