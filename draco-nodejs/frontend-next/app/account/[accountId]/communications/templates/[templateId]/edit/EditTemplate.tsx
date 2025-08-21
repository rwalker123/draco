import { useParams } from 'next/navigation';
import TemplateForm from '../../new/TemplateForm';

export default function EditTemplate() {
  const { templateId } = useParams();

  return <TemplateForm mode="edit" templateId={templateId as string} />;
}
