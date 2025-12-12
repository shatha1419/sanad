import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackButton() {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(-1)}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <ArrowRight className="w-4 h-4" />
      رجوع
    </Button>
  );
}
